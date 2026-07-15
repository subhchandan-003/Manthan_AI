import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

const DEFAULT_MODEL: Record<string, string> = {
  anthropic: "claude-sonnet-5",
  google: "gemini-2.5-flash-lite",
};

/**
 * Single switch point for every AI call in the app. Set AI_PROVIDER (anthropic | google)
 * in the environment to pick the backing LLM — every route keeps calling this same
 * function, so swapping providers (e.g. paid Claude in production, free-tier Gemini for
 * local testing) never requires touching route/prompt code, only env vars.
 *
 * To add another provider: install its @ai-sdk/* package, add a case below and a
 * default model id above, and set the matching API key env var.
 */
export function aiModel(): LanguageModel {
  const provider = (process.env.AI_PROVIDER ?? "anthropic").toLowerCase();
  switch (provider) {
    case "google":
      return google(process.env.GOOGLE_MODEL ?? DEFAULT_MODEL.google);
    case "anthropic":
    default:
      return anthropic(process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL.anthropic);
  }
}
