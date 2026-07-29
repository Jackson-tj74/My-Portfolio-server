import { StatusCodes } from "http-status-codes";
import { handleError, handleSuccess } from "../../utils/responseUtils.js";
import { contentSchema, contentQuerySchema } from "../../validations/portfolioValidations.js";
import { createContent, getContent, listContent, softDeleteContent, updateContent } from "../../services/portfolioContentService.js";
import { notifyProviders } from "../../services/notificationService.js";

const validate = (schema, value) => {
  const { error, value: validValue } = schema.validate(value, { abortEarly: false });
  if (error) throw Object.assign(new Error(error.details.map((item) => item.message).join(", ")), { statusCode: StatusCodes.BAD_REQUEST });
  return validValue;
};

class portfolioControllers {
  static listPublic = async (req, res) => {
    try {
      const query = validate(contentQuerySchema, req.query);
      const result = await listContent({ kind: req.params.kind, publishedOnly: true, ...query });
      return handleSuccess(res, StatusCodes.OK, "Published content retrieved", result);
    } catch (error) { return handleError(res, error.statusCode || StatusCodes.BAD_REQUEST, error.message); }
  };

  static listAdmin = async (req, res) => {
    try {
      const query = validate(contentQuerySchema, req.query);
      const result = await listContent({ kind: req.params.kind, ...query });
      return handleSuccess(res, StatusCodes.OK, "Content retrieved", result);
    } catch (error) { return handleError(res, error.statusCode || StatusCodes.BAD_REQUEST, error.message); }
  };

  static get = async (req, res) => {
    try {
      const item = await getContent(req.params.kind, req.params.id);
      if (!item || item.status !== "published") return handleError(res, StatusCodes.NOT_FOUND, "Published content not found");
      return handleSuccess(res, StatusCodes.OK, "Content retrieved", item);
    } catch (error) { return handleError(res, StatusCodes.BAD_REQUEST, error.message); }
  };

  static create = async (req, res) => {
    try {
      const payload = validate(contentSchema, req.body);
      const item = await createContent(req.params.kind, payload);
      await notifyProviders({ type: "content", title: "Content created", message: `${req.params.kind} item “${item.title}” was created.`, link: "/dashboard/content", metadata: { contentId: item._id.toString(), kind: req.params.kind } });
      return handleSuccess(res, StatusCodes.CREATED, "Content created", item);
    } catch (error) { return handleError(res, error.code === 11000 ? StatusCodes.CONFLICT : (error.statusCode || StatusCodes.BAD_REQUEST), error.code === 11000 ? "A content item with this slug already exists" : error.message); }
  };

  static update = async (req, res) => {
    try {
      const payload = validate(contentSchema, req.body);
      const item = await updateContent(req.params.kind, req.params.id, payload);
      if (!item) return handleError(res, StatusCodes.NOT_FOUND, "Content not found");
      await notifyProviders({ type: "content", title: "Content updated", message: `${req.params.kind} item “${item.title}” was updated.`, link: "/dashboard/content", metadata: { contentId: item._id.toString(), kind: req.params.kind } });
      return handleSuccess(res, StatusCodes.OK, "Content updated", item);
    } catch (error) { return handleError(res, error.code === 11000 ? StatusCodes.CONFLICT : (error.statusCode || StatusCodes.BAD_REQUEST), error.message); }
  };

  static remove = async (req, res) => {
    try {
      const item = await softDeleteContent(req.params.kind, req.params.id);
      if (!item) return handleError(res, StatusCodes.NOT_FOUND, "Content not found");
      await notifyProviders({ type: "content", title: "Content archived", message: `${req.params.kind} item “${item.title}” was archived.`, link: "/dashboard/content", metadata: { contentId: item._id.toString(), kind: req.params.kind } });
      return handleSuccess(res, StatusCodes.OK, "Content archived", item);
    } catch (error) { return handleError(res, StatusCodes.BAD_REQUEST, error.message); }
  };
}

export default portfolioControllers;
