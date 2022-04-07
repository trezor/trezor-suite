import * as Methods from '../api';
import { TypedError } from '../constants/errors';
import type { IFrameCallMessage } from '../events';

export const getMethod = (message: IFrameCallMessage & { id?: number }) => {
    const { method } = message.payload;
    if (typeof method !== 'string') {
        throw TypedError('Method_InvalidParameter', 'Message method is not set');
    }

    const MethodConstructor = Methods[method];
    if (MethodConstructor) {
        return new MethodConstructor(message as any);
    }

    throw TypedError('Method_InvalidParameter', `Method ${method} not found`);
};
