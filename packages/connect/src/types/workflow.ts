import type { AbstractMethod } from '../core/AbstractMethod';
import type { Device } from '../device/Device';

export type WorkflowContext = {
    device: Device;
    method: AbstractMethod<any>;
    signal: AbortSignal;
};
