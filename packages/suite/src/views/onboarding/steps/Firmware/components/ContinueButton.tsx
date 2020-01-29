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

const ContinueButton = ({ isConnected, isInBootloader, onClick }: ButtonProps) => {
    let content = '';
    if (!isConnected) {
        content = 'Connect device to continue';
    } else if (isInBootloader) {
        content = 'Leave bootloader mode to continue';
    }
    return (
        <Tooltip
            trigger={isConnected && !isInBootloader ? 'manual' : 'mouseenter focus'}
            placement="bottom"
            content={content}
        >
            <OnboardingButton.Cta
                data-test="@onboarding/button-continue"
                isDisabled={!isConnected || isInBootloader}
                onClick={() => onClick()}
            >
                <Translation {...messages.TR_CONTINUE} />
            </OnboardingButton.Cta>
        </Tooltip>
    );
};

export default ContinueButton;
