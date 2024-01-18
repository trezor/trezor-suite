import { UI_REQUEST } from './ui-request';
import { UI_RESPONSE } from './ui-response';

export * from './blockchain';
export * from './call';
export * from './core';
export * from './device';
export * from './iframe';
export * from './popup';
export * from './transport';
export * from './ui-promise';
export * from './ui-request';
export * from './ui-response';
export * from './webextension';

// NOTE: for backward compatibility wrap ui const into one
export const UI = {
    ...UI_REQUEST,
    ...UI_RESPONSE,
} as const;
