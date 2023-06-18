import React from 'react';
import { Button } from '@trezor/components';

import { Translation, TroubleshootingTips } from 'src/components/suite';
import { useActions } from 'src/hooks/suite';
import * as routerActions from 'src/actions/suite/routerActions';

export const DeviceNoFirmware = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <TroubleshootingTips
            label={<Translation id="TR_NO_FIRMWARE" />}
            cta={
                <Button
                    onClick={e => {
                        e.stopPropagation();
                        goto('onboarding-index');
                    }}
                >
                    <Translation id="TR_GO_TO_ONBOARDING" />
                </Button>
            }
            items={[
                {
                    key: 'device-firmware-missing',
                    heading: <Translation id="TR_NO_FIRMWARE" />,
                    description: <Translation id="TR_NO_FIRMWARE_EXPLAINED" />,
                },
            ]}
        />
    );
};
