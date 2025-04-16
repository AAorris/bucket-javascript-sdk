import { version } from "../package.json";

export const API_BASE_URL = "https://front.bucket.co";
export const SDK_VERSION_HEADER_NAME = "bucket-sdk-version";
export const SDK_VERSION = `node-sdk/${version}`;
export const API_TIMEOUT_MS = 10000;
export const END_FLUSH_TIMEOUT_MS = 5000;

export const BUCKET_LOG_PREFIX = "[Bucket]";

export const FEATURE_EVENT_RATE_LIMITER_WINDOW_SIZE_MS = 60 * 1000;

export const FEATURES_REFETCH_MS = 60 * 1000; // re-fetch every 60 seconds

export const BATCH_MAX_SIZE = 100;
export const BATCH_INTERVAL_MS = 10 * 1000;

function loadEnvVars() {
  const secretKey = process.env.BUCKET_SECRET_KEY;
  const enabledFeatures = process.env.BUCKET_FEATURES_ENABLED;
  const disabledFeatures = process.env.BUCKET_FEATURES_DISABLED;
  const logLevel = process.env.BUCKET_LOG_LEVEL;
  const apiBaseUrl = process.env.BUCKET_API_BASE_URL ?? process.env.BUCKET_HOST;
  const offline =
    process.env.BUCKET_OFFLINE !== undefined
      ? ["true", "on"].includes(process.env.BUCKET_OFFLINE)
      : undefined;

  let featureOverrides: Record<string, boolean> = {};
  if (enabledFeatures) {
    featureOverrides = enabledFeatures.split(",").reduce(
      (acc, f) => {
        const key = f.trim();
        if (key) acc[key] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }

  if (disabledFeatures) {
    featureOverrides = {
      ...featureOverrides,
      ...disabledFeatures.split(",").reduce(
        (acc, f) => {
          const key = f.trim();
          if (key) acc[key] = false;
          return acc;
        },
        {} as Record<string, boolean>,
      ),
    };
  }

  return { secretKey, featureOverrides, logLevel, offline, apiBaseUrl };
}

export function loadConfig(file?: string) {
  if (file) {
    throw new Error("file not supported");
  }
  const envConfig = loadEnvVars();

  return {
    secretKey: envConfig.secretKey,
    logLevel: envConfig.logLevel,
    offline: envConfig.offline,
    apiBaseUrl: envConfig.apiBaseUrl,
    featureOverrides: {
      ...envConfig.featureOverrides,
    },
  };
}
