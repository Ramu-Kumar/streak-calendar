import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Request, Response, NextFunction } from "express";
import { config, validateConfig } from "../config";
import { findUserById, upsertGoogleUser } from "../storage/repository";
import { User } from "../types";

export function configurePassport(): void {
  validateConfig();

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await findUserById(id);
      done(null, user ?? false);
    } catch (error) {
      done(error as Error);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientID ?? "",
        clientSecret: config.google.clientSecret ?? "",
        callbackURL: config.google.callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await upsertGoogleUser({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value ?? "",
            avatarUrl: profile.photos?.[0]?.value,
          });
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.isAuthenticated?.() && req.user) {
    next();
    return;
  }

  res.status(401).json({ message: "Authentication required" });
}

