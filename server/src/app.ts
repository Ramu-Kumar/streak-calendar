import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config";
import { configurePassport } from "./auth/passport";
import { userRouter } from "./routes/userRoutes";
import { taskRouter } from "./routes/taskRoutes";
import { activityRouter } from "./routes/activityRoutes";

let passportConfigured = false;
let sessionStore: session.Store | null = null;

function ensurePassportConfigured(): void {
  if (!passportConfigured) {
    configurePassport();
    passportConfigured = true;
  }
}

function getSessionStore(): session.Store {
  if (sessionStore) {
    return sessionStore;
  }

  if (!config.mongo.uri) {
    throw new Error("MONGODB_URI must be configured for session storage");
  }

  const store = MongoStore.create({
    mongoUrl: config.mongo.uri,
    dbName: config.mongo.dbName,
    collectionName: "sessions",
    ttl: 60 * 60 * 24 * 30, // 30 days
  }) as unknown as session.Store;

  sessionStore = store;
  return store;
}

export function createApp(): express.Express {
  ensurePassportConfigured();

  const app = express();
  // Trust proxy headers (Render/other hosting providers terminate TLS upstream)
  // so secure cookies and protocol-aware logic work correctly behind the proxy.
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: getSessionStore(),
      cookie: {
        secure: config.nodeEnv === "production",
        sameSite: config.nodeEnv === "production" ? "none" : "lax",
      },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${config.clientUrl}/login?error=oauth`,
      session: true,
    }),
    (_req, res) => {
      res.redirect(config.clientUrl);
    }
  );

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

  app.use("/api/user", userRouter);
  app.use("/api/tasks", taskRouter);
  app.use("/api/activity", activityRouter);

  app.use(
    (
      error: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      // eslint-disable-next-line no-console
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  );

  return app;
}

