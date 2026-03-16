import { useState } from 'react';

import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { selectSelectedDevice } from '@suite-common/device';
import { Column } from '@trezor/components';
import TrezorConnect, { UI_RESPONSE } from '@trezor/connect';

import { PinMatrix } from 'src/components/suite';
import { useOnboarding, useSelector } from 'src/hooks/suite';

export const ShowPinMatrixStep = () => {
    const [pin, setPin] = useState('');
    const device = useSelector(selectSelectedDevice);
    const { activeStepId, showPinMatrix } = useOnboarding();
    const handlePinSubmit = () => {
        TrezorConnect.uiResponse({ type: UI_RESPONSE.RECEIVE_PIN, payload: pin });
        setPin('');
    };

    // After the PIN is set it may happen that it takes too long for an user to finish the onboarding process.
    // Then the device will get auto locked and requests to show a PIN matrix next before changing its setting.
    // (which could happen on Final step where we set device name and homescreen)
    if (device?.features && activeStepId !== 'set-pin' && showPinMatrix) {
        return (
            <OnboardingCard
                heading={<Translation id="TR_ENTER_PIN" />}
                device={device}
                isConfirmedOnDevice
                isActionAbortable={false}
                innerActions={
                    <OnboardingCard.Button
                        onClick={handlePinSubmit}
                        data-testid="@pin/submit-button"
                    >
                        <Translation id="TR_CONFIRM" />
                    </OnboardingCard.Button>
                }
            >
                <Column alignItems="center">
                    <PinMatrix pin={pin} setPin={setPin} onSubmit={handlePinSubmit} />
                </Column>
            </OnboardingCard>
        );
    }
};
