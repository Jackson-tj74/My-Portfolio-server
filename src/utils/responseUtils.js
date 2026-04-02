const buildSuccessResponse = (statusCode, message, data)  => {
  return {
    status: statusCode,
    success: true,
    message: message,
    data: data
  };
}

const buildErrorResponse = (statusCode, error)  => {
  return {
    status: statusCode,
    success: false,
    error: error
  };
}

const handleSuccess = (res, statusCode = 200, message = "success.", data = {}) => {
  const response = buildSuccessResponse(statusCode, message, data);
  return res.status(statusCode).json(response);
}

const handleError = (res, statusCode = 500, error = "Error.") => {
  const response = buildErrorResponse(statusCode,error.toString() || JSON.stringify(error));
  return res.status(statusCode).json(response);

}

export {
  handleSuccess,
  handleError
};
