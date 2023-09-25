import styled from 'styled-components';

import { checkDeviceAuthenticityThunk } from '@suite-common/device-authenticity';
import { selectDevice } from '@suite-common/wallet-core';
import { Icon, variables } from '@trezor/components';
import { goToNextStep } from 'src/actions/onboarding/onboardingActions';

import { OnboardingButtonCta, OnboardingStepBox } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

const Items = styled.div`
    display: grid;
    gap: 40px;
    grid-template-columns: repeat(3, 1fr);
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
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
    const dispatch = useDispatch();

    const isDeviceAuthenticated = !!(device?.id && deviceAuthenticity?.[device.id]?.valid);
    const isWaitingForConfirmation = !!device?.buttonRequests.some(
        request => request.code === 'ButtonRequest_Other',
    );

    const getHeadingText = () => {
        if (isDeviceAuthenticated) {
            return 'TR_CONGRATS';
        }
        return isWaitingForConfirmation ? 'TR_CHECKING_YOUR_DEVICE' : 'TR_LETS_CHECK_YOUR_DEVICE';
    };
    const getDescription = () => {
        if (isDeviceAuthenticated) {
            return (
                <Translation
                    id="TR_DEVICE_AUTHENTICITY_SUCCESS_DESCRIPTION"
                    values={{ deviceName: device.name }}
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
            await dispatch(
                checkDeviceAuthenticityThunk({
                    allowDebugKeys: true,
                }),
            );
        };
        const goToNext = () => dispatch(goToNextStep());
        const handleClick = isDeviceAuthenticated ? goToNext : authenticateDevice;

        const buttonText = isDeviceAuthenticated ? 'TR_CONTINUE' : 'TR_START_CHECK';

        return (
            <OnboardingButtonCta onClick={handleClick}>
                <Translation id={buttonText} />
            </OnboardingButtonCta>
        );
    };

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
            <Items>
                {!isDeviceAuthenticated &&
                    items.map(({ icon, text }) => (
                        <Item key={icon}>
                            <Icon icon={icon} size={32} />
                            <Translation id={text} />
                        </Item>
                    ))}
            </Items>
        </OnboardingStepBox>
    );
};
