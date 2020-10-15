import React, { isValidElement } from 'react';
import { Translation } from '@suite-components';
import { ExtendedMessageDescriptor } from '@suite-types';
import { TypedFieldError } from '@wallet-types/form';

const InputError = ({ error }: { error?: TypedFieldError }) => {
    if (!error) return null;
    const { type, message } = error;
    if (typeof message === 'string') {
        return <Translation id={message as ExtendedMessageDescriptor['id']} />;
    }
    if (isValidElement(message)) {
        return message;
    }

    if (message && typeof message === 'object' && message.id) {
        return <Translation {...message} />;
    }

    // fallback
    return <>{`Unknown InputError: ${type}`}</>;
};

export default InputError;
