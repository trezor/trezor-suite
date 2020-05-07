import React from 'react';
import { getFormattedFingerprint, getTextForStatus } from '@firmware-utils';
import { AppState } from '@suite-types';
import { Translation } from '@suite-components';
import { Loaders, Text } from '@onboarding-components';

import { Fingerprint, InitImg } from '.';

interface Props {
    fingerprint: string;
    status: AppState['firmware']['status'];
    model: number;
}

const FirmwareProgress = ({ fingerprint, status, model }: Props) => {
    return (
        <>
            <InitImg model={model} />
            <Text>
                <Translation id={getTextForStatus(status)} />
                <Loaders.Dots />
            </Text>
            {status === 'check-fingerprint' && (
                <Fingerprint>{getFormattedFingerprint(fingerprint)}</Fingerprint>
            )}
        </>
    );
};

export default FirmwareProgress;
