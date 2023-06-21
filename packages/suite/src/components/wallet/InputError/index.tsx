import React, { isValidElement } from 'react';
import { Translation } from 'src/components/suite';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import { TypedFieldError } from 'src/types/wallet/form';

const InputError = ({ error }: { error?: TypedFieldError }) => {
    if (!error) return null;

    const { type, message } = error;

    if (typeof message === 'string') {
        return <Translation id={message as ExtendedMessageDescriptor['id']} />;
    }

    if (isValidElement(message)) {
        return message;
    }

    if (message && 'id' in message && typeof message.id === 'string') {
        return <Translation {...(message as ExtendedMessageDescriptor)} />;
    }

    // fallback
    return <>{`Unknown InputError: ${type}`}</>;
};

export default InputError;
