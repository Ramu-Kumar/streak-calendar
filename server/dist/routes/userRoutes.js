"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const passport_1 = require("../auth/passport");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.get("/me", passport_1.requireAuth, (req, res) => {
    res.json({ user: req.user });
});
//# sourceMappingURL=userRoutes.js.map