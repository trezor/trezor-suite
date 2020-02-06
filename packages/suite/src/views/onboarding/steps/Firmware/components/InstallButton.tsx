import React from 'react';
import { OnboardingButton } from '@onboarding-components';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { Tooltip } from '@trezor/components';

interface ButtonProps {
    onClick: () => void;
    isConnected: boolean;
    isInBootloader: boolean;
}

const InstallButton = ({ isConnected, isInBootloader, onClick }: ButtonProps) => {
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
                <Translation {...messages.TR_INSTALL} />
            </OnboardingButton.Cta>
        </Tooltip>
    );
};

export default InstallButton;
