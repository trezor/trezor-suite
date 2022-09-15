import React from 'react';

import { UI } from '@trezor/connect';

// views
import { Transport, TransportProps } from './views/Transport';
import { Passphrase, PassphraseProps } from './views/Passphrase';
import { ErrorView, ErrorViewProps } from './views/Error';

// support
import { ThemeWrapper } from './support/ThemeWrapper';
import { IntlWrapper } from './support/IntlWrapper';
import { ErrorBoundary } from './support/ErrorBoundary';
import { GlobalStyle } from './support/GlobalStyle';

export type ConnectUIProps = TransportProps | PassphraseProps | ErrorViewProps;

export const ConnectUI = (props: ConnectUIProps) => {
    const getComponent = () => {
        switch (props.type) {
            case UI.TRANSPORT:
                return <Transport {...props} />;
            case UI.REQUEST_PASSPHRASE:
                return <Passphrase {...props} />;
            case 'error':
                return <ErrorView {...props} />;
            default:
                // @ts-expect-error
                throw new Error(`no such view exists: ${props.type}`);
        }
    };

    return (
        <ErrorBoundary>
            <GlobalStyle />
            <ThemeWrapper>
                {/* todo: load translations from somewhere and pass them to intl */}
                <IntlWrapper>{getComponent()}</IntlWrapper>
            </ThemeWrapper>
        </ErrorBoundary>
    );
};
