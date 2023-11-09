import { useState } from 'react';
// useDispatch used directly from react-redux instead of src/hooks/suite because we need unwrap() method
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { checkDeviceAuthenticityThunk } from '@suite-common/device-authenticity';
import { selectDevice } from '@suite-common/wallet-core';
import { variables } from '@trezor/components';

import { reportToSentry } from 'src/utils/suite/sentry';
import { OnboardingButtonCta, OnboardingStepBox } from 'src/components/onboarding';
import { CollapsibleOnboardingCard } from 'src/components/onboarding/CollapsibleOnboardingCard';
import { DeviceAuthenticationExplainer, Translation } from 'src/components/suite';
import { useOnboarding, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
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
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const { goToNextStep, goToSuite, isActive: isOnboarding } = useOnboarding();
    const dispatch = useDispatch();
    const [result, setResult] = useState<{ resolved: boolean; valid?: boolean }>({
        resolved: false,
    });

    if (!device) return null;

    const isWaitingForConfirmation =
        !result.resolved &&
        device.buttonRequests.some(request => request.code === 'ButtonRequest_Other');
    const isCheckFailed = result.resolved && !result.valid;

    const getHeadingText = () => {
        if (result.valid) {
            return 'TR_CONGRATS';
        }
        return isWaitingForConfirmation ? 'TR_CHECKING_YOUR_DEVICE' : 'TR_LETS_CHECK_YOUR_DEVICE';
    };
    const getDescription = () => {
        if (result.valid) {
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
            const result = await dispatch(
                checkDeviceAuthenticityThunk({
                    allowDebugKeys: isDebugModeActive,
                    skipSuccessToast: true,
                }),
            ).unwrap();
            setResult(result);

            // Report to sentry if bootloader is unlocked, other errors are reported by sentryMiddleware.
            if (result?.error?.includes('bootloader is unlocked')) {
                dispatch(reportToSentry(new Error(`Device authenticity error: ${result.error}`)));
            }
        };
        const goToNext = () => (isOnboarding ? goToSuite() : goToNextStep());
        const handleClick = result.resolved ? goToNext : authenticateDevice;

        const buttonText = result.resolved ? 'TR_CONTINUE' : 'TR_START_CHECK';

        return (
            <OnboardingButtonCta
                onClick={handleClick}
                data-test={
                    result.resolved
                        ? '@authenticity-check/continue-button'
                        : `@authenticity-check/start-button`
                }
            >
                <Translation id={buttonText} />
            </OnboardingButtonCta>
        );
    };

    if (isCheckFailed) {
        return (
            <StyledCard>
                <SecurityCheckFail />
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
            {!result.resolved && <StyledExplainer horizontal />}
        </OnboardingStepBox>
    );
};
