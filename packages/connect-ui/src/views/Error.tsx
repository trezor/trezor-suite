import React from 'react';

import { Button, Image } from '@trezor/components';

import { View } from '../components/View';
import imageSrc from '../images/man_with_laptop.svg';

// todo: move this to @trezor/env-utils
const isFirefox =
    typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

interface ErrorProps {
    error: 'handshake-timeout';
}

const errorCodeToErrorMessage = (code: ErrorProps['error']) => {
    switch (code) {
        case 'handshake-timeout':
            return 'Failed to establish communication between host and connect.trezor.io/popup';
        default:
            throw new Error('unhandled case');
    }
};

const getTroubleshootingTips = (code: ErrorProps['error']) => {
    if (code === 'handshake-timeout' && isFirefox) {
        return [
            {
                desc: 'Check if "Enhanced tracking protection" setting in your Firefox browser is off.',
            },
        ];
    }

    return [];
};

export const ErrorView = (props: ErrorProps) => (
    <View
        title={errorCodeToErrorMessage(props.error)}
        description={
            getTroubleshootingTips(props.error)
                .map(tip => tip.desc)
                .join('') || ''
        }
        image={<Image imageSrc={imageSrc} />}
        buttons={
            // todo: maybe button onClick handler should be passed in props? Why?
            // maybe we wan't connect-ui to become a mini application run-able over host application in modal?
            // so far it only expects to be run in own window in popup
            <Button variant="primary" onClick={() => window.close()}>
                Close
            </Button>
        }
    />
);
