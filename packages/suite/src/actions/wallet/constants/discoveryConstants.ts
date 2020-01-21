export const CREATE = '@discovery/create';
export const START = '@discovery/start';
export const UPDATE = '@discovery/update';
export const FAILED = '@discovery/failed';
export const INTERRUPT = '@discovery/interrupt';
export const STOP = '@discovery/stop';
export const COMPLETE = '@discovery/complete';
export const REMOVE = '@discovery/remove';
export const STATUS = {
    IDLE: 0,
    RUNNING: 1,
    STOPPING: 2,
    STOPPED: 3,
    COMPLETED: 4,
} as const;
