import React from 'react';
import styled from 'styled-components';
import { TroubleshootingTips } from '@onboarding-components';
import { Translation } from '@suite-components';
import { isWeb } from '@suite-utils/env';

const Wrapper = styled.div`
    display: flex;
`;

const NoTransport = () => (
    // No transport layer (bridge/webUSB) is available
    // On web it makes sense to offer downloading Trezor Bridge
    // Desktop app should have Bridge transport layer available as it is built-in, if it is not available we fucked up something.
    <Wrapper>
        <TroubleshootingTips
            label={<Translation id="TR_TREZOR_BRIDGE_IS_NOT_RUNNING" />}
            items={[
                {
                    key: '1',
                    heading: 'Make sure Trezor Bridge is installed and running',
                    description: 'There should be probably a link to download it somewhere',
                    hide: !isWeb(),
                },
                {
                    key: '2',
                    heading: 'Restart you computer',
                    description: 'Just in case',
                },
            ]}
        />
    </Wrapper>
);
export default NoTransport;
