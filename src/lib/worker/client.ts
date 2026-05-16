/**
 * Main-thread client for the logcat worker.
 *
 * Lazily instantiates the worker on first call so that we don't pay the
 * boot cost during initial route render.
 */

import * as Comlink from "comlink";
import type { LogcatWorkerAPI } from "./logcat.worker";

let _api: Comlink.Remote<LogcatWorkerAPI> | null = null;

export function getWorkerAPI(): Comlink.Remote<LogcatWorkerAPI> {
  if (_api) return _api;
  const worker = new Worker(new URL("./logcat.worker.ts", import.meta.url), {
    type: "module",
  });
  _api = Comlink.wrap<LogcatWorkerAPI>(worker);
  return _api;
}

/** Tear down the worker (used in tests + teardown hooks). */
export function disposeWorkerAPI(): void {
  _api = null;
}
