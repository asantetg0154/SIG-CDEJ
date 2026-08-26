import type { Request, Response } from "express";
import { createApp } from "../server/_core/index";

/**
 * Vercel serverless entry point. Static Vite files are deployed from
 * dist/public; vercel.json rewrites every /api request to this Express app.
 */
const app = createApp();

export default function handler(req: Request, res: Response) {
  return app(req, res);
}
