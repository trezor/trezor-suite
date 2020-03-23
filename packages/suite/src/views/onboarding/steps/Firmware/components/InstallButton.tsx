import React from 'react';
import { Tooltip } from '@trezor/components';

import { OnboardingButton } from '@onboarding-components';
import { Translation } from '@suite-components';

interface ButtonProps {
    onClick: () => void;
    isConnected: boolean;
    isInBootloader: boolean;
    btcOnly: boolean;
}

const InstallButton = ({ isConnected, isInBootloader, btcOnly, onClick }: ButtonProps) => {
    let content = '';
    if (!isConnected) {
        content = 'Connect device to continue';
    } else if (!isInBootloader) {
        content = 'Go to bootloader';
    }
    return (
        <Tooltip
            trigger={isConnected && isInBootloader ? 'manual' : 'mouseenter focus'}
            placement="bottom"
            content={content}
        >
            <OnboardingButton.Cta
                isDisabled={!isConnected || !isInBootloader}
                onClick={() => onClick()}
            >
                {btcOnly && <Translation id="TR_INSTALL_BTC_ONLY" />}
                {!btcOnly && <Translation id="TR_INSTALL_FULL" />}
            </OnboardingButton.Cta>
        </Tooltip>
    );
};

export default InstallButton;
