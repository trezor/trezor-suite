import React from 'react';

import { UI } from '@trezor/connect';

// views
// support
import { ThemeWrapper } from './support/ThemeWrapper';
import { IntlWrapper } from './support/IntlWrapper';
import { ErrorBoundary } from './support/ErrorBoundary';

export type ConnectUIProps =
    | TransportProps
    | PassphraseProps
    | PassphraseOnDeviceProps
    | ErrorViewProps;

export const ConnectUI = (props: ConnectUIProps) => {
    const getComponent = () => {
        switch (props.type) {
            default:
                // @ts-expect-error
                throw new Error(`no such view exists: ${props.type}`);
        }
    };
    return (
        <ErrorBoundary>
            <ThemeWrapper>
                {/* todo: load translations from somewhere and pass them to intl */}
                <IntlWrapper>{getComponent()}</IntlWrapper>
            </ThemeWrapper>
        </ErrorBoundary>
    );
};
