import React from 'react';
import { Button } from '@trezor/components';

import { Translation, TroubleshootingTips } from '@suite-components';
import { useDevice, useActions } from '@suite-hooks';
import * as suiteActions from '@suite-actions/suiteActions';
import { isDesktop } from '@suite-utils/env';

const DeviceAcquire = () => {
    const { isLocked } = useDevice();
    const { acquireDevice } = useActions({
        acquireDevice: suiteActions.acquireDevice,
    });
    return (
        <TroubleshootingTips
            label={<Translation id="TR_ACQUIRE_DEVICE_TITLE" />}
            cta={
                <Button
                    data-test="@device-acquire"
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
                    description: (
                        <Translation
                            id={
                                isDesktop()
                                    ? 'TR_TROUBLESHOOTING_CLOSE_TABS_DESCRIPTION_DESKTOP'
                                    : 'TR_TROUBLESHOOTING_CLOSE_TABS_DESCRIPTION'
                            }
                        />
                    ),
                },
                {
                    key: 'device-reconnect',
                    heading: <Translation id="TR_RECONNECT_YOUR_DEVICE" />,
                    description: (
                        <Translation
                            id={
                                isDesktop()
                                    ? 'TR_RECONNECT_DEVICE_DESCRIPTION_DESKTOP'
                                    : 'TR_RECONNECT_DEVICE_DESCRIPTION'
                            }
                        />
                    ),
                },
            ]}
        />
    );
};

export default DeviceAcquire;
