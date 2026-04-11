import catchAsync from '../../utility/catchAsync'
import sendResponse from '../../utility/sendResponse'
import { AuthServices } from './auth.service'

// signup user
const registeredUser = catchAsync(async (req, res) => {
  const result = await AuthServices.registeredUserIntoDB(req.body)
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User registered successfully',
    data: result,
  })
})

// login user
const loginUser = catchAsync(async (req, res) => {
  const result = await AuthServices.loginUser(req.body)
  const { accessToken, user } = result
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User logged in successfully',
    token: accessToken,
    data: user,
  })
})

// change password
const changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userEmail = req.user?.userEmail;

  const result = await AuthServices.changePassword(userEmail, oldPassword, newPassword);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Password changed successfully',
    data: result,
  });
});

const logoutUser = catchAsync(async (req, res) => {
  const userId = req.user?.id;

  await AuthServices.logOutUser(userId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User logged out successfully',
    data: null,
  });
});

export const AuthControllers = {
  registeredUser,
  loginUser,
  changePassword,
  logoutUser,
}
