import { useState } from 'react';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Button, Column } from '@trezor/components';
import TrezorConnect, { UI } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { OnboardingStepBox } from 'src/components/onboarding';
import { PinMatrix, Translation } from 'src/components/suite';
import { useOnboarding, useSelector } from 'src/hooks/suite';

export const ShowPinMatrix = () => {
    const [pin, setPin] = useState('');
    const device = useSelector(selectSelectedDevice);
    const { activeStepId, showPinMatrix } = useOnboarding();
    const handlePinSubmit = () => {
        TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin });
        setPin('');
    };

    // After the PIN is set it may happen that it takes too long for an user to finish the onboarding process.
    // Then the device will get auto locked and requests to show a PIN matrix next before changing its setting.
    // (which could happen on Final step where we set device name and homescreen)
    if (device?.features && activeStepId !== 'set-pin' && showPinMatrix) {
        return (
            <OnboardingStepBox
                heading={<Translation id="TR_ENTER_PIN" />}
                device={device}
                isActionAbortable={false}
            >
                <Column gap={spacings.md}>
                    <PinMatrix pin={pin} setPin={setPin} onSubmit={handlePinSubmit} />
                    <Button onClick={handlePinSubmit} data-testid="@pin/submit-button">
                        <Translation id="TR_CONFIRM" />
                    </Button>
                </Column>
            </OnboardingStepBox>
        );
    }
};
