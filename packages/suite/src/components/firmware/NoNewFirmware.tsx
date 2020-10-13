import React from 'react';

import { CHANGELOG_URL } from '@suite-constants/urls';
import { getFwVersion } from '@suite-utils/device';
import { useDevice } from '@suite-hooks';
import { P, H2, SuccessImg } from '@firmware-components';
import { Translation, ExternalLink } from '@suite-components';

const Heading = () => <Translation id="TR_FIRMWARE_UPDATE" />;

const Body = () => {
    const { device } = useDevice();

    if (!device?.features) return null;

    return (
        <>
            <SuccessImg model={device.features.major_version} />
            <H2>
                <Translation id="TR_FIRMWARE_IS_UP_TO_DATE" />
            </H2>
            <P>
                <Translation
                    id="TR_FIRMWARE_INSTALLED_TEXT"
                    values={{ version: getFwVersion(device) }}
                />{' '}
                <ExternalLink size="small" href={CHANGELOG_URL}>
                    <Translation id="TR_WHATS_NEW_FIRMWARE" />
                </ExternalLink>
            </P>
        </>
    );
};

export const NoNewFirmware = {
    Heading,
    Body,
};
