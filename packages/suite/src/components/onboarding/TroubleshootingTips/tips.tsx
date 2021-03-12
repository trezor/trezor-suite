import React from 'react';
import { TrezorLink } from '@suite-components';
import { Translation } from '@suite-components/Translation';
import { SUITE_BRIDGE_URL } from '@suite-constants/urls';
import { isWeb } from '@suite-utils/env';

export const TROUBLESHOOTING_TIP_BRIDGE = {
    key: 'bridge',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_BRIDGE_TITLE" />,
    description: (
        <Translation
            id="TR_TROUBLESHOOTING_TIP_BRIDGE_DESCRIPTION"
            values={{
                a: chunks => (
                    <TrezorLink variant="underline" href={SUITE_BRIDGE_URL}>
                        {chunks}
                    </TrezorLink>
                ),
            }}
        />
    ),
    hide: !isWeb(),
};

export const TROUBLESHOOTING_TIP_CABLE = {
    key: 'cable',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_CABLE_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_CABLE_DESCRIPTION" />,
};

export const TROUBLESHOOTING_TIP_USB = {
    key: 'usbPort',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_USB_PORT_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_USB_PORT_DESCRIPTION" />,
};

export const TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER = {
    key: 'differentComputer',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_COMPUTER_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_COMPUTER_DESCRIPTION" />,
};

export const TROUBLESHOOTING_TIP_RESTART_COMPUTER = {
    key: 'restartComputer',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_DESCRIPTION" />,
};
