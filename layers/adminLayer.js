import asyncHandler from "./asyncHandler.js";

const admin = asyncHandler(async (req, res, next) => {
  if (req.user.level !== 1) {
    res.status(403)
    throw new Error(`You don't have the necessary permissions to perform this action`)
  }
  next()
})

export default admin;
