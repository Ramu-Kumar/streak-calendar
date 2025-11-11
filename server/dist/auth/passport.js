"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurePassport = configurePassport;
exports.requireAuth = requireAuth;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const config_1 = require("../config");
const repository_1 = require("../storage/repository");
function configurePassport() {
    (0, config_1.validateConfig)();
    passport_1.default.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport_1.default.deserializeUser(async (id, done) => {
        try {
            const user = await (0, repository_1.findUserById)(id);
            done(null, user ?? false);
        }
        catch (error) {
            done(error);
        }
    });
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: config_1.config.google.clientID ?? "",
        clientSecret: config_1.config.google.clientSecret ?? "",
        callbackURL: config_1.config.google.callbackURL,
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const user = await (0, repository_1.upsertGoogleUser)({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails?.[0]?.value ?? "",
                avatarUrl: profile.photos?.[0]?.value,
            });
            done(null, user);
        }
        catch (error) {
            done(error);
        }
    }));
}
function requireAuth(req, res, next) {
    if (req.isAuthenticated?.() && req.user) {
        next();
        return;
    }
    res.status(401).json({ message: "Authentication required" });
}
//# sourceMappingURL=passport.js.map