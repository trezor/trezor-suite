import type { CoreEventMessage } from '@trezor/connect-common/src/events/core';

import type { IDevice } from './idevice';

/**
 * Minimal method interface for device workflows.
 * Avoids importing AbstractMethod (which would create a circular dependency
 * through AbstractMethod → Device → handshake → types/workflow).
 */
export interface WorkflowMethod {
    preauthorized?: boolean;
    useCardanoDerivation: boolean;
    postMessage: (message: CoreEventMessage) => void;
}

export type WorkflowContext = {
    device: IDevice;
    method: WorkflowMethod;
    signal: AbortSignal;
};

export type TpnWorkflowContext = {
    device: IDevice;
    message: number[];
};
