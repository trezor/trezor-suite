import * as Methods from '../api';
import { ERRORS } from '../constants';
import { MethodCallMessage } from '../events';

// REF-TODO abstract method constructor params
export const getMethod = (message: MethodCallMessage & { id?: number }) => {
    const { method } = message.payload;
    if (typeof method !== 'string') {
        throw ERRORS.TypedError('Method_InvalidParameter', 'Message method is not set');
    }

    const MethodConstructor = Methods[method];
    if (MethodConstructor) {
        return new MethodConstructor(message as any); // REF-TODO
    }

    throw ERRORS.TypedError('Method_InvalidParameter', `Method ${method} not found`);
};
