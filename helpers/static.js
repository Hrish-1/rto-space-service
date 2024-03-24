const HttpCodes = {
    Ok: 200,
    Created: 201,
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    NotPermitted: 405,
    Conflict: 409,
    UnprocessableEntity: 422,
    InternalServerError: 500
}


const Messages = {
    AcknowledgedSuccess: 'Acknowledged successfully',
    AuthTokenNotFound: 'Authentication token not found',
    AuthTokenExpired:'Authentication token expired',
    BadRequest: 'Bad request. missing field(s) in request',
    DataCreatedSuccess: 'Data created successfully',
    DataSavedSuccess: 'Data saved successfully to database',
    DataSaveFailed: 'Failed to save data',
    DataRetrievedSuccess: 'Data retrieved successfully',
    DataUpdateSuccess: 'Data updated successfully',
    DataUpdateFail:'Data update failed',
    DataDeletedSuccess: 'Data deleted successfully',
    ErrorFetchingData: 'An error occured while fetching data',
    ErrorOccured: 'An error occurred',
    EmailSentSuccess: 'Email sent successfully',
    InvalidPassword: 'Invalid password',
    InternalServerError: 'Internal server error',
    IncorrectPassword: 'Incorrect password. Please try again',
    InvalidCredentials:'Invalid credentials',
    LoginSuccess: 'Successfully logged in',
    LoginUnsuccess:'Login unsuccessful',
    NoPDFUploaded: 'No pdf file uploaded',
    NoRecordFound: 'No record found',
    NoOrderDetails: 'Order details not found',
    NoDataFound: 'No data found',
    ProcessingStarted: 'Processing started',
    PasswordNotMatched: 'Both passwords didn\'t match',
    PasswordChangedSuccess: 'Password changed successfully',
    RegistrationSuccess: 'Registration successful',
    SignedOutSuccess: 'Signed out successfully',
    SmsSentSuccess: 'SMS sent successfully to your mobile number',
    UserRegistrationSuccess:'User created successfully',
    UserAlreadyExists: 'User already exists',
    UserNotFound: 'User not found',
    WrongEmail:'Wrong email',
    WrongPassword: 'Wrong password',
    Unauthorized: 'Invalid authentication token',
    MissingFields: 'Missing fields for login',
}

export {
    HttpCodes, Messages
}