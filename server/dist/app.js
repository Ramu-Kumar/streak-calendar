"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const passport_1 = __importDefault(require("passport"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config");
const passport_2 = require("./auth/passport");
const userRoutes_1 = require("./routes/userRoutes");
const taskRoutes_1 = require("./routes/taskRoutes");
const activityRoutes_1 = require("./routes/activityRoutes");
let passportConfigured = false;
let sessionStore = null;
function ensurePassportConfigured() {
    if (!passportConfigured) {
        (0, passport_2.configurePassport)();
        passportConfigured = true;
    }
}
function getSessionStore() {
    if (sessionStore) {
        return sessionStore;
    }
    if (!config_1.config.mongo.uri) {
        throw new Error("MONGODB_URI must be configured for session storage");
    }
    const store = connect_mongo_1.default.create({
        mongoUrl: config_1.config.mongo.uri,
        dbName: config_1.config.mongo.dbName,
        collectionName: "sessions",
        ttl: 60 * 60 * 24 * 30, // 30 days
    });
    sessionStore = store;
    return store;
}
function createApp() {
    ensurePassportConfigured();
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: config_1.config.clientUrl,
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use((0, morgan_1.default)("dev"));
    app.use((0, express_session_1.default)({
        secret: config_1.config.sessionSecret,
        resave: false,
        saveUninitialized: false,
        store: getSessionStore(),
        cookie: {
            secure: config_1.config.nodeEnv === "production",
            sameSite: config_1.config.nodeEnv === "production" ? "none" : "lax",
        },
    }));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    app.get("/auth/google", passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
    app.get("/auth/google/callback", passport_1.default.authenticate("google", {
        failureRedirect: `${config_1.config.clientUrl}/login?error=oauth`,
        session: true,
    }), (_req, res) => {
        res.redirect(config_1.config.clientUrl);
    });
    app.post("/auth/logout", (req, res, next) => {
        req.logout((error) => {
            if (error) {
                next(error);
                return;
            }
            req.session?.destroy(() => {
                res.status(204).send();
            });
        });
    });
    app.use("/api/user", userRoutes_1.userRouter);
    app.use("/api/tasks", taskRoutes_1.taskRouter);
    app.use("/api/activity", activityRoutes_1.activityRouter);
    app.use((error, _req, res, _next) => {
        // eslint-disable-next-line no-console
        console.error(error);
        res.status(500).json({ message: error.message });
    });
    return app;
}
//# sourceMappingURL=app.js.map