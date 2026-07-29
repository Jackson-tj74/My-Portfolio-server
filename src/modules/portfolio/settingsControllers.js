import { StatusCodes } from "http-status-codes";
import PortfolioSetting from "../../database/models/PortfolioSetting.js";
import { handleError, handleSuccess } from "../../utils/responseUtils.js";

class settingsControllers {
  static publicSettings = async (_req, res) => {
    try {
      const rows = await PortfolioSetting.find().sort({ key: 1 }).lean();
      return handleSuccess(res, StatusCodes.OK, "Portfolio settings retrieved", Object.fromEntries(rows.map((row) => [row.key, row.value])));
    } catch (error) { return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message); }
  };
  static adminSettings = async (_req, res) => settingsControllers.publicSettings(_req, res);
  static updateSetting = async (req, res) => {
    try {
      const key = req.params.key.toLowerCase();
      if (!/^[a-z][a-z0-9_-]{1,80}$/.test(key)) return handleError(res, StatusCodes.BAD_REQUEST, "Invalid setting key");
      const row = await PortfolioSetting.findOneAndUpdate({ key }, { key, value: req.body.value }, { new: true, upsert: true, runValidators: true });
      return handleSuccess(res, StatusCodes.OK, "Portfolio setting saved", row);
    } catch (error) { return handleError(res, StatusCodes.BAD_REQUEST, error.message); }
  };
}
export default settingsControllers;
