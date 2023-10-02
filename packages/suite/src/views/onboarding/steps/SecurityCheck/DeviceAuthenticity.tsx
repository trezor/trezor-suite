import { useState } from 'react';
import styled from 'styled-components';

import { checkDeviceAuthenticityThunk } from '@suite-common/device-authenticity';
import { selectDevice } from '@suite-common/wallet-core';
import { variables } from '@trezor/components';
import { ERROR_CODES } from '@trezor/connect/lib/constants/errors';

import { OnboardingButtonCta, OnboardingStepBox } from 'src/components/onboarding';
import { CollapsibleOnboardingCard } from 'src/components/onboarding/CollapsibleOnboardingCard';
import { DeviceAuthenticationExplainer, Translation } from 'src/components/suite';
import { useDispatch, useOnboarding, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { SecurityCheckLayout } from './SecurityCheckLayout';
import { SecurityCheckFail } from './SecurityCheckFail';

const StyledCard = styled(CollapsibleOnboardingCard)`
    padding: 16px;
`;

const StyledExplainer = styled(DeviceAuthenticationExplainer)`
    @media only screen and (min-width: ${variables.SCREEN_SIZE.SM}) {
        grid-template-columns: repeat(3, 1fr);
    }
`;

export const DeviceAuthenticity = () => {
    const device = useSelector(selectDevice);
    const deviceAuthenticity = useSelector(state => state.device.deviceAuthenticity);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const { activeStepId, goToNextStep, goToSuite } = useOnboarding();
    const dispatch = useDispatch();
    // Tracking confirmation state with useState because button request is not removed from the array
    // when the request is confirmed or aborted, the array is only reset on step change.
    const [isSubmitted, setIsSubmitted] = useState(false);
    // Tracking request cancellation because it is the only error that does not trigger the fail screen.
    const [isAborted, setIsAborted] = useState(false);

    const isWaitingForConfirmation =
        !!device?.buttonRequests.some(request => request.code === 'ButtonRequest_Other') &&
        !isSubmitted;
    const isCheckSuccessful = !!(device?.id && deviceAuthenticity?.[device.id]?.valid);
    const isCheckFailed =
        isSubmitted &&
        !isAborted &&
        !!device?.id &&
        (deviceAuthenticity?.[device.id]?.valid === false || !deviceAuthenticity?.[device.id]);

    const getHeadingText = () => {
        if (isCheckSuccessful) {
            return 'TR_CONGRATS';
        }
        return isWaitingForConfirmation ? 'TR_CHECKING_YOUR_DEVICE' : 'TR_LETS_CHECK_YOUR_DEVICE';
    };
    const getDescription = () => {
        if (isCheckSuccessful) {
            return (
                <Translation
                    id="TR_DEVICE_AUTHENTICITY_SUCCESS_DESCRIPTION"
                    values={{ deviceName: device.name, br: <br /> }}
                />
            );
        }
        if (!isWaitingForConfirmation) {
            return <Translation id="TR_AUTHENTICATE_DEVICE_DESCRIPTION" />;
        }
    };
    const getInnerActions = () => {
        if (isWaitingForConfirmation) {
            return;
        }

        const authenticateDevice = async () => {
            setIsSubmitted(false);
            const result = await dispatch(
                checkDeviceAuthenticityThunk({
                    allowDebugKeys: isDebugModeActive,
                }),
            );
            if (result.payload === ERROR_CODES.Method_Cancel) {
                setIsAborted(true);
            }
            setIsSubmitted(true);
        };
        const goToNext = () => (activeStepId === 'welcome' ? goToSuite() : goToNextStep());
        const handleClick = isCheckSuccessful ? goToNext : authenticateDevice;

        const buttonText = isCheckSuccessful ? 'TR_CONTINUE' : 'TR_START_CHECK';

        return (
            <OnboardingButtonCta onClick={handleClick}>
                <Translation id={buttonText} />
            </OnboardingButtonCta>
        );
    };

    if (isCheckFailed) {
        return (
            <StyledCard>
                <SecurityCheckLayout>
                    <SecurityCheckFail />
                </SecurityCheckLayout>
            </StyledCard>
        );
    }

    return (
        <OnboardingStepBox
            image="CHECK_SHIELD"
            heading={<Translation id={getHeadingText()} />}
            description={getDescription()}
            innerActions={getInnerActions()}
            device={device}
            disableConfirmWrapper={!isWaitingForConfirmation}
            isActionAbortable
        >
            {!isCheckSuccessful && <StyledExplainer horizontal />}
        </OnboardingStepBox>
    );
};
