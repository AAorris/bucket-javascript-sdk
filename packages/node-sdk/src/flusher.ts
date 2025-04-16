import { END_FLUSH_TIMEOUT_MS } from "./config";
import { TimeoutError, withTimeout } from "./utils";

type Callback = () => Promise<void>;

const killSignals = ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"] as const;

export function subscribe(
  callback: Callback,
  timeout: number = END_FLUSH_TIMEOUT_MS,
) {
  let state: boolean | undefined;

  const wrappedCallback = async () => {
    if (state !== undefined) {
      return;
    }

    state = false;

    try {
      await withTimeout(callback(), timeout);
    } catch (error) {
      if (error instanceof TimeoutError) {
        console.error(
          "[Bucket SDK] Timeout while flushing events on process exit.",
        );
      } else {
        console.error(
          "[Bucket SDK] An error occurred while flushing events on process exit.",
          error,
        );
      }
    }

    state = true;
  };

  // Edge runtime does not support node:os import or process.listenerCount below
  if (typeof EdgeRuntime !== "string") {
    const importOs = import("node:os").catch(() => {
      console.error(
        "[Bucket SDK] Failed to import node:os. Cannot listen to process events.",
      );
    });

    for (const signal of killSignals) {
      if (typeof process.listenerCount !== "function") continue;
      void importOs.then((os) => {
        if (!os) return;
        const hasListeners = process.listenerCount(signal) > 0;

        if (hasListeners) {
          process.prependListener(signal, wrappedCallback);
        } else {
          process.on(signal, async () => {
            await wrappedCallback();
            process.exit(0x80 + os.constants.signals[signal]);
          });
        }
      });
    }

    if (typeof process.on !== "function") return;
    process.on("beforeExit", wrappedCallback);
    process.on("exit", () => {
      if (!state) {
        console.error(
          "[Bucket SDK] Failed to finalize the flushing of events on process exit.",
        );
      }
    });
  }
}
