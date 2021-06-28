import React from 'react';
import styled from 'styled-components';
import { Translation, TroubleshootingTips } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

// Seedless devices are not supported by Trezor Suite
const DeviceSeedless = () => (
    <Wrapper>
        <TroubleshootingTips
            label={<Translation id="TR_YOUR_DEVICE_IS_SEEDLESS" />}
            items={[
                {
                    key: 'device-seedless',
                    heading: <Translation id="TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_TITLE" />,
                    description: (
                        <Translation id="TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_DESCRIPTION" />
                    ),
                },
            ]}
        />
    </Wrapper>
);

export default DeviceSeedless;
