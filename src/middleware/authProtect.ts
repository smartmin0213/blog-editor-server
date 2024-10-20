import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
  Secret,
  JwtPayload
} from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import Blog from "../models/blogModel";

declare module "express" {
  interface Request {
    user?: JwtPayload; 
  }
}

const protect = async (req: Request, res: Response, next: NextFunction) => {
  const { headers } = req;
  let accessToken: any = headers.authorization
    ? headers.authorization.split(" ")[1]
    : null;

  if (req.query.authToken) accessToken = req.query.authToken;

  try {
    if (!accessToken) {
      req.user = {};
      return next();
    }

    const jwtSecret: Secret = process.env.JWT_SECRET_KEY || "defaultSecret";
    const decoded = await jwt.verify(accessToken, jwtSecret) as JwtPayload;
    
    if (req.params.id) {
      const blog = await Blog.findOne({ _id: req.params.id, userId: decoded.id });

      if (!blog) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this blog.",
        });
      }
    }

    req.user = decoded;
    return next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Token has expired.",
      });
    }
    if (err instanceof JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }
    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

export default protect;
