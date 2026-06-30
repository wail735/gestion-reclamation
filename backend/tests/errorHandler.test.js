const { errorHandler } = require('../middleware/errorHandler');

describe('errorHandler Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  it('should return 400 for ValidationError', () => {
    const error = new Error('Validation Error');
    error.name = 'ValidationError';
    error.errors = {
      field: { message: 'Validation Error' }
    };

    errorHandler(error, mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Erreur de validation des données',
      stack: expect.any(String)
    }));
  });

  it('should return 500 for generic server errors', () => {
    const error = new Error('Internal Server Error');

    errorHandler(error, mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Internal Server Error'
    }));
  });
});
