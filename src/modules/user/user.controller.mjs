export const getAllUsers = async (req, res, next) => {
  try {
    return res.send({
      message: "Welcome",
    });
  } catch (err) {
    next(err);
  }
};
