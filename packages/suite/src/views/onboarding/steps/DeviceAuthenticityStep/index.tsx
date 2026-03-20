import { useState } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { selectIsDebugModeActive } from '@suite/settings';
import { OnboardingCard } from '@suite/onboarding-components';
import { selectDeviceAuthenticityByDeviceId, selectSelectedDevice } from '@suite-common/device';
import { checkDeviceAuthenticityThunk } from '@suite-common/device-authenticity';
import { Card, Column, Grid, Icon, type IconName, Paragraph } from '@trezor/components';

import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';
import { AuthenticateDeviceSupportButton } from 'src/components/suite/SecurityCheck/deviceCompromisedCtas';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';

const items: { icon: IconName; text: TranslationKey }[] = [
    { icon: 'shieldCheck', text: 'TR_DEVICE_AUTHENTICITY_ITEM_1' },
    { icon: 'cpu', text: 'TR_DEVICE_AUTHENTICITY_ITEM_2' },
    { icon: 'listChecks', text: 'TR_DEVICE_AUTHENTICITY_ITEM_3' },
];

type DeviceAuthenticityProps = {
    goToNext: () => void;
};

export const DeviceAuthenticityStep = ({ goToNext }: DeviceAuthenticityProps) => {
    const device = useSelector(selectSelectedDevice);
    const selectedDeviceAuthenticity = useSelector(state =>
        selectDeviceAuthenticityByDeviceId(state, device?.id),
    );
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { isBelowTablet } = useLayoutSize();

    if (!device) return null;

    const isWaitingForConfirmation = device.buttonRequests.some(
        request =>
            request.code === 'ButtonRequest_Other' || // Device Authenticity prompt
            request.code === 'ButtonRequest_PinEntry', // Device can be locked, and we can get Pin Request first
    );
    const isCheckFailed = isSubmitted && selectedDeviceAuthenticity?.valid === false;
    const isCheckSuccessful = isSubmitted && selectedDeviceAuthenticity?.valid === true;

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
            setIsLoading(true);
            await dispatch(
                checkDeviceAuthenticityThunk({
                    allowDebugKeys: isDebugModeActive,
                    skipSuccessToast: true,
                }),
            );
            setIsLoading(false);
            setIsSubmitted(true);
        };

        const handleClick = () => {
            if (isCheckSuccessful) {
                goToNext();
            } else {
                authenticateDevice();
            }
        };

        const buttonText = isCheckSuccessful ? 'TR_CONTINUE' : 'TR_START_CHECK';

        return (
            <OnboardingCard.Button
                onClick={handleClick}
                isDisabled={isLoading}
                isLoading={isLoading}
                data-testid={
                    isCheckSuccessful
                        ? '@authenticity-check/continue-button'
                        : `@authenticity-check/start-button`
                }
            >
                <Translation id={buttonText} />
            </OnboardingCard.Button>
        );
    };

    if (isCheckFailed) {
        return (
            <Card paddingType="large">
                <SecurityCheckFail
                    ctaSection={<AuthenticateDeviceSupportButton />}
                    text="TR_DEVICE_COMPROMISED_DEVICE_AUTHENTICITY_TEXT"
                />
            </Card>
        );
    }

    return (
        <OnboardingCard
            iconName="shieldCheck"
            heading={<Translation id={getHeadingText()} />}
            description={getDescription()}
            innerActions={getInnerActions()}
            device={device}
            isConfirmedOnDevice={isWaitingForConfirmation}
            isActionAbortable
        >
            {!isCheckSuccessful && (
                <Grid columns={isBelowTablet ? 1 : items.length} gap={48}>
                    {items.map(({ icon, text }) => (
                        <Column key={icon} gap={24} alignItems="center">
                            <Icon name={icon} size={32} />
                            <Paragraph
                                intent="neutral"
                                priority="secondary"
                                typographyStyle="body-sm"
                                align="center"
                                textWrap="pretty"
                            >
                                <Translation id={text} />
                            </Paragraph>
                        </Column>
                    ))}
                </Grid>
            )}
        </OnboardingCard>
    );
};
