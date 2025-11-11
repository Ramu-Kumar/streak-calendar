import { Router } from "express";
import { requireAuth } from "../auth/passport";

export const userRouter = Router();

userRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

