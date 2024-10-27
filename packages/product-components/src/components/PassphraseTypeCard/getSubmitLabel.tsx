import type { ReactNode } from 'react';
import React from 'react';
import { FormattedMessage } from 'react-intl';

export const getSubmitLabel = ({
    nonAsciiChars,
    label,
    showPassword,
}: {
    nonAsciiChars: null | string[];
    label: ReactNode;
    showPassword: boolean;
}) => {
    if (!nonAsciiChars) return label;

    const displaySingleChar = showPassword && nonAsciiChars.length === 1;
    const messageId = displaySingleChar ? 'TR_NON_ASCII_CHAR' : 'TR_NON_ASCII_CHARS';
    const chars = displaySingleChar ? '"{char}"' : 'characters';
    const defaultMessage = `{label} (with non-recommended ${chars})`;

    return (
        <FormattedMessage
            id={messageId}
            defaultMessage={defaultMessage}
            values={{ char: nonAsciiChars[0], label }}
        />
    );
};
