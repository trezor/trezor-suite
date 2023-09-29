import { useState } from 'react';
import styled from 'styled-components';

import { checkDeviceAuthenticityThunk } from '@suite-common/device-authenticity';
import { selectDevice } from '@suite-common/wallet-core';
import { Icon, variables } from '@trezor/components';
import { ERROR_CODES } from '@trezor/connect/lib/constants/errors';

import { OnboardingButtonCta, OnboardingStepBox } from 'src/components/onboarding';
import { CollapsibleOnboardingCard } from 'src/components/onboarding/CollapsibleOnboardingCard';
import { Translation } from 'src/components/suite';
import { useDispatch, useOnboarding, useSelector } from 'src/hooks/suite';
import { SecurityCheckLayout } from './SecurityCheckLayout';
import { SecurityCheckFail } from './SecurityCheckFail';

const StyledCard = styled(CollapsibleOnboardingCard)`
    padding: 16px;
`;

const Items = styled.div`
    display: grid;
    gap: 40px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    @media only screen and (min-width: ${variables.SCREEN_SIZE.SM}) {
        grid-template-columns: repeat(3, 1fr);
    }
`;

const Item = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 24px;
    text-align: center;
`;

const items = [
    { icon: 'SHIELD_CHECK', text: 'TR_DEVICE_AUTHENTICITY_ITEM_1' },
    { icon: 'CHIP', text: 'TR_DEVICE_AUTHENTICITY_ITEM_2' },
    { icon: 'CHECKLIST', text: 'TR_DEVICE_AUTHENTICITY_ITEM_3' },
] as const;

export const DeviceAuthenticity = () => {
    const device = useSelector(selectDevice);
    const deviceAuthenticity = useSelector(state => state.device.deviceAuthenticity);
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
                    allowDebugKeys: true,
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
        <>
            <OnboardingStepBox
                image="CHECK_SHIELD"
                heading={<Translation id={getHeadingText()} />}
                description={getDescription()}
                innerActions={getInnerActions()}
                device={device}
                disableConfirmWrapper={!isWaitingForConfirmation}
                isActionAbortable
            >
                <Items>
                    {!isCheckSuccessful &&
                        items.map(({ icon, text }) => (
                            <Item key={icon}>
                                <Icon icon={icon} size={32} />
                                <Translation id={text} />
                            </Item>
                        ))}
                </Items>
            </OnboardingStepBox>
        </>
    );
};
