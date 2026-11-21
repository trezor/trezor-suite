/** Must match `SERVICE_WORKER_FILE_NAME` of the bundler options, which page code cannot import. */
export const SERVICE_WORKER_SCRIPT_NAME = 'sw.js';

/** A parameter of the worker's URL that turns Serwist's logs on. Only dev builds contain them. */
export const SERVICE_WORKER_DEV_LOGS_PARAMETER = 'dev-logs';

/** Messages a page sends to the worker. Serwist itself handles `SkipWaiting`. */
export const ServiceWorkerMessageType = {
    GetBuildInfo: 'GET_BUILD_INFO',
    SkipWaiting: 'SKIP_WAITING',
    Uninstall: 'UNINSTALL',
} as const;

export type ServiceWorkerMessageType =
    (typeof ServiceWorkerMessageType)[keyof typeof ServiceWorkerMessageType];

export type ServiceWorkerMessage = { type: ServiceWorkerMessageType };

/** Messages the worker sends to the pages it controls. */
export const ServiceWorkerClientMessageType = {
    Reload: 'RELOAD',
} as const;

export type ServiceWorkerClientMessageType =
    (typeof ServiceWorkerClientMessageType)[keyof typeof ServiceWorkerClientMessageType];

export type ServiceWorkerClientMessage = { type: ServiceWorkerClientMessageType };

export const getMessageType = (data: unknown) =>
    typeof data === 'object' && data !== null && 'type' in data ? data.type : undefined;
