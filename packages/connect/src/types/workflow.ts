import type { IDevice } from './idevice';
import type { CoreEventMessage } from '../events/core';

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
