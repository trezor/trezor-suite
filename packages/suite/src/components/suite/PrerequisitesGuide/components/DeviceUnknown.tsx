import React from 'react';
import styled from 'styled-components';
import { Translation, TroubleshootingTips } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const DeviceUnknown = () => (
    <Wrapper>
        <TroubleshootingTips
            label={<Translation id="TR_UNKNOWN_DEVICE" />}
            items={[
                {
                    key: 'device-unknown',
                    heading: <Translation id="TR_UNKNOWN_DEVICE" />,
                    description: 'This is a very rare case. Please contact our support team.',
                },
            ]}
        />
    </Wrapper>
);

export default DeviceUnknown;
