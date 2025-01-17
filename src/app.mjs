import express from "express";
import routes from "./route.mjs";
import { errorHandler } from "./middlewares/errorHandler.mjs";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

routes(app);
app.use(errorHandler);

export default app;
