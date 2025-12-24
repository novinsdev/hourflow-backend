import { AuthUser } from '../src/middleware/authJwt';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
