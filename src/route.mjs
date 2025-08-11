import userRouter from "./modules/user/user.route.mjs";
import authRouter from "./modules/auth/auth.route.mjs";
import donorRouter from "./modules/donor/donor.route.mjs";
const routes = (app) => {
  app.use("/users", userRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/donor", donorRouter);
};

export default routes;
