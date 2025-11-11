"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requiredEnvVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET,
    MONGODB_URI: process.env.MONGODB_URI,
};
exports.config = {
    port: process.env.PORT ? Number(process.env.PORT) : 4000,
    nodeEnv: process.env.NODE_ENV ?? "development",
    clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
    mongo: {
        uri: process.env.MONGODB_URI,
        dbName: process.env.MONGODB_DB_NAME ?? "consistency_heatmap",
    },
    google: {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:4000/auth/google/callback",
    },
    sessionSecret: process.env.SESSION_SECRET ?? "dev-secret",
};
function validateConfig() {
    if (exports.config.nodeEnv === "development") {
        return;
    }
    const missing = Object.entries(requiredEnvVars)
        .filter(([, value]) => !value)
        .map(([key]) => key);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
}
//# sourceMappingURL=config.js.map