import React from 'react';
import { FieldError } from 'react-hook-form';
import { Translation } from '@suite-components';
import { ExtendedMessageDescriptor } from '@suite-types';

export default ({ error }: { error?: FieldError }) => {
    if (!error) return null;
    const { type, message } = error;
    if (typeof message === 'string') {
        // its not possible to type FieldError of react-hook-form :(
        return <Translation id={message as ExtendedMessageDescriptor['id']} />;
    }
    // fallback
    return <>{`Unknown InputError: ${type}`}</>;
};
