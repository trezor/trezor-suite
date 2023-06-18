import React from 'react';
import { Button } from '@trezor/components';

import { Translation, TroubleshootingTips } from 'src/components/suite';
import { useActions } from 'src/hooks/suite';
import * as routerActions from 'src/actions/suite/routerActions';

export const DeviceUpdateRequired = () => {
    const { goto } = useActions({ goto: routerActions.goto });

    return (
        <TroubleshootingTips
            label={<Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />}
            cta={
                <Button
                    onClick={e => {
                        e.stopPropagation();
                        goto('firmware-index');
                    }}
                >
                    <Translation id="TR_SEE_DETAILS" />
                </Button>
            }
            items={[
                {
                    key: 'device-firmware-required',
                    heading: <Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />,
                    description: <Translation id="TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED" />,
                },
            ]}
        />
    );
};
