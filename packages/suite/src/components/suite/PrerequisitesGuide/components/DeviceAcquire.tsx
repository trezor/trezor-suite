import React from 'react';
import styled from 'styled-components';

import { Button } from '@trezor/components';

import { Translation, TroubleshootingTips } from '@suite-components';
import { useDevice, useActions } from '@suite-hooks';
import * as suiteActions from '@suite-actions/suiteActions';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const DeviceAcquire = () => {
    const { isLocked } = useDevice();
    const { acquireDevice } = useActions({
        acquireDevice: suiteActions.acquireDevice,
    });
    return (
        <Wrapper>
            <TroubleshootingTips
                label={<Translation id="TR_ACQUIRE_DEVICE_TITLE" />}
                cta={
                    <Button
                        isLoading={isLocked()}
                        onClick={e => {
                            e.stopPropagation();
                            acquireDevice();
                        }}
                    >
                        <Translation id="TR_ACQUIRE_DEVICE" />
                    </Button>
                }
                items={[
                    {
                        key: 'device-acquire',
                        heading: <Translation id="TR_TROUBLESHOOTING_CLOSE_TABS" />,
                        description: <Translation id="TR_TROUBLESHOOTING_CLOSE_TABS_DESCRIPTION" />,
                    },
                    {
                        key: 'device-reconnect',
                        heading: <Translation id="TR_RECONNECT_YOUR_DEVICE" />,
                        description: <Translation id="TR_RECONNECT_DEVICE_DESCRIPTION" />,
                    },
                ]}
            />
        </Wrapper>
    );
};

export default DeviceAcquire;
