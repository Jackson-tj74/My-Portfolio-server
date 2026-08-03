const buildSuccessResponse = (statusCode, message, data) => ({
  status: statusCode,
  success: true,
  message,
  data,
});

const buildErrorResponse = (statusCode, error) => ({
  status: statusCode,
  success: false,
  error,
});

const handleSuccess = (res, statusCode = 200, message = "success.", data = {}) => {
  const response = buildSuccessResponse(statusCode, message, data);
  return res.status(statusCode).json(response);
};

const handleError = (res, statusCode = 500, error = "Error.") => {
  const response = buildErrorResponse(statusCode, error.toString() || JSON.stringify(error));
  return res.status(statusCode).json(response);
};

export { handleSuccess, handleError };