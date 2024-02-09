// Please don't change the pre-written code
// Import the necessary modules here
import UserModel from "../models/user.schema.js";
import { sendPasswordResetEmail } from "../../../utils/emails/passwordReset.js";
import { sendWelcomeEmail } from "../../../utils/emails/welcomeMail.js";
import { ErrorHandler } from "../../../utils/errorHandler.js";
import { sendToken } from "../../../utils/sendToken.js";
import {
  createNewUserRepo,
  deleteUserRepo,
  findUserForPasswordResetRepo,
  findUserRepo,
  getAllUsersRepo,
  updateUserProfileRepo,
  updateUserRoleAndProfileRepo,
} from "../models/user.repository.js";
import crypto from "crypto";

export const createNewUser = async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    const newUser = await createNewUserRepo(req.body);
    await sendToken(newUser, res, 200);

    // Implement sendWelcomeEmail function to send welcome message
    await sendWelcomeEmail(newUser);
  } catch (err) {
    //  handle error for duplicate email
    return next(new ErrorHandler(400, err));
  }
};

export const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler(400, "please enter email/password"));
    }
    const user = await findUserRepo({ email }, true);
    if (!user) {
      return next(
        new ErrorHandler(401, "user not found! register yourself now!!")
      );
    }
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return next(new ErrorHandler(401, "Invalid email or passswor!"));
    }
    await sendToken(user, res, 200);
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const logoutUser = async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({ success: true, msg: "logout successful" });
};

// export const forgetPassword = async (req, res, next) => {
//   const { email } = req.body;

//   try {
//     // Find the user by email
//     const user = await findUserRepo({ email },true);

//     // Check if the user exists
//     if (!user) {
//       return next(new ErrorHandler(404, "User not found with the provided email"));
//     }

//     // Generate a reset token and save it to the user
//     const resetToken = await user.getResetPasswordToken();
//     await user.save({ validateBeforeSave: false });

//     // Construct the reset password URL
//     const resetUrl = `${req.protocol}://${req.get("host")}/api/users/password/reset/${resetToken}`;

//     // Implement the function to send the password reset email
//     await sendPasswordResetEmail(user, resetUrl);

//     res.status(200).json({
//       success: true,
//       message: "Password reset email sent successfully. Check your email for instructions.",
//       token:resetToken,
//     });
//   } catch (error) {
//     return next(new ErrorHandler(500, error.message || "Internal Server Error"));
//   }
// };
export const forgetPassword = async (req, res, next) => {
  // Implement feature for forget password
  const { email } = req.body;
  const user = await findUserRepo({ email }, true);
  if (!user) {
    return next(new ErrorHandler(400, "user not found!"));
  }
  const token = await user.getResetPasswordToken();
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  await user.save({ validateBeforeSave: false });
  try {
    await sendPasswordResetEmail(user,hashedToken);
    res.status(200).json({ success: true, msg: "Email sent successfully", hashedToken });
  }
  catch (error) {
    return next(new ErrorHandler(500, error));
  }
};
export const resetUserPassword = async (req, res, next) => {
  // Implement feature for reset password
  const { token } = req.params;
  const { password, confirmPassword } = req.body;
  try{
    const user = await findUserForPasswordResetRepo(token);
  if (!user) {
    return next(new ErrorHandler(400, "invalid token or token expired!"));
  }
  if (!password || password !== confirmPassword) {
    return next(new ErrorHandler(400, "password mismatch!"));
  }
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, msg: "password reset successful" });
  }
  catch(error){
    return next(new ErrorHandler(500, error));
  }

};


export const getUserDetails = async (req, res, next) => {
  try {
    const userDetails = await findUserRepo({ _id: req.user._id });
    res.status(200).json({ success: true, userDetails });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};

export const updatePassword = async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  try {
    if (!currentPassword) {
      return next(new ErrorHandler(401, "pls enter current password"));
    }

    const user = await findUserRepo({ _id: req.user._id }, true);
    const passwordMatch = await user.comparePassword(currentPassword);
    if (!passwordMatch) {
      return next(new ErrorHandler(401, "Incorrect current password!"));
    }

    if (!newPassword || newPassword !== confirmPassword) {
      return next(
        new ErrorHandler(401, "mismatch new password and confirm password!")
      );
    }

    user.password = newPassword;
    await user.save();
    await sendToken(user, res, 200);
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const updateUserProfile = async (req, res, next) => {
  const { name, email } = req.body;
  try {
    const updatedUserDetails = await updateUserProfileRepo(req.user._id, {
      name,
      email,
    });
    res.status(201).json({ success: true, updatedUserDetails });
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

// admin controllers
export const getAllUsers = async (req, res, next) => {
  try {
    const allUsers = await getAllUsersRepo();
    res.status(200).json({ success: true, allUsers });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};

export const getUserDetailsForAdmin = async (req, res, next) => {
  try {
    const userDetails = await findUserRepo({ _id: req.params.id });
    if (!userDetails) {
      return res
        .status(400)
        .json({ success: false, msg: "no user found with provided id" });
    }
    return res.status(200).json({ success: true, userDetails });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await deleteUserRepo(req.params.id);
    if (!deletedUser) {
      return res
        .status(400)
        .json({ success: false, msg: "no user found with provided id" });
    }

    res
      .status(200)
      .json({ success: true, msg: "user deleted successfully", deletedUser });
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const updateUserProfileAndRole = async (req, res, next) => {
  // Write your code here for updating the roles of other users by admin
  try{
  const _id=req.params.id;
  const {name,email,role}=req.body;
  const data={name,email,role};
  const updated=await updateUserRoleAndProfileRepo(_id,data);
  res
  .status(200)
  .json({ success: true, msg: "admin updated successfully", updated });
  }catch(err){
    console.log(err);
    return res
        .status(400)
        .json({ success: false, msg: "not updated admin" });
  }
};
// Please don't change the pre-written code
// Import the necessary modules here
