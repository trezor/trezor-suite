import { type ReactNode, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDebugModeActive } from '@suite/debug';
import { Translation, type TranslationKey } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { selectDeviceButtonRequests, selectSelectedDevice } from '@suite-common/device';
import { checkDeviceAuthenticityThunk } from '@suite-common/device-authenticity';
import {
    type PersistentDeviceDataRootState,
    selectDeviceAuthenticityByDeviceId,
} from '@suite-common/persistent-device-data';
import { injectDispatch } from '@suite-common/redux-utils';
import { Card, Column, Grid, Icon, type IconComponent, Paragraph } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CpuIcon, ListChecksIcon, ShieldCheckIcon } from '@trezor/icons';

import { useLayoutSize } from 'src/hooks/suite';

import { SecurityCheckFail } from './components/SecurityCheckFail';
import { AuthenticateDeviceSupportButton } from './components/ctas';

const items: { id: string; icon: IconComponent; text: TranslationKey }[] = [
    { id: 'security', icon: ShieldCheckIcon, text: 'TR_DEVICE_AUTHENTICITY_ITEM_1' },
    { id: 'chip', icon: CpuIcon, text: 'TR_DEVICE_AUTHENTICITY_ITEM_2' },
    { id: 'checks', icon: ListChecksIcon, text: 'TR_DEVICE_AUTHENTICITY_ITEM_3' },
];

const ExplanationBeforeCheck = () => {
    const { isBelowTablet } = useLayoutSize();

    return (
        <Grid columns={isBelowTablet ? 1 : items.length} gap={48}>
            {items.map(({ id, icon, text }) => (
                <Column key={id} gap={24} alignItems="center">
                    <Icon as={icon} size={32} />
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
    );
};

type DeviceAuthenticityCheckProps = {
    onSuccess: () => void;
};

/**
 * Reusable component encapsulating the entire Device Authenticity Check flow.
 */
export const DeviceAuthenticityCheck = ({ onSuccess }: DeviceAuthenticityCheckProps) => {
    const device = useSelector(selectSelectedDevice);
    const buttonRequests = useSelector(selectDeviceButtonRequests);
    const selectedDeviceAuthenticity = useSelector((state: PersistentDeviceDataRootState) =>
        selectDeviceAuthenticityByDeviceId(state, device?.id),
    );
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const { dispatch } = useServices(injectDispatch);
    const [isLoading, setIsLoading] = useState(false);

    if (!device) return null;

    const isWaitingForConfirmation = buttonRequests.some(
        request =>
            request.code === 'ButtonRequest_Other' || // Device Authenticity prompt
            request.code === 'ButtonRequest_PinEntry', // Device can be locked, and we can get Pin Request first
    );
    const isCheckFailed = selectedDeviceAuthenticity?.valid === false;
    const isCheckSuccessful = selectedDeviceAuthenticity?.valid === true;

    const getHeading = (): ReactNode => {
        if (isCheckSuccessful) return <Translation id="TR_CONGRATS" />;
        if (isWaitingForConfirmation) return <Translation id="TR_CHECKING_YOUR_DEVICE" />;

        return <Translation id="TR_LETS_CHECK_YOUR_DEVICE" />;
    };

    const getDescription = (): ReactNode => {
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

        return null;
    };

    const getInnerActions = (): ReactNode => {
        if (isWaitingForConfirmation) return null;

        const authenticateDevice = async () => {
            setIsLoading(true);
            await dispatch(
                checkDeviceAuthenticityThunk({
                    allowDebugKeys: isDebugModeActive,
                    skipSuccessToast: true,
                }),
            );
            setIsLoading(false);
        };

        return isCheckSuccessful ? (
            <OnboardingCard.Button
                onClick={onSuccess}
                isDisabled={isLoading}
                isLoading={isLoading}
                data-testid="@authenticity-check/continue-button"
            >
                <Translation id="TR_CONTINUE" />
            </OnboardingCard.Button>
        ) : (
            <OnboardingCard.Button
                onClick={authenticateDevice}
                isDisabled={isLoading}
                isLoading={isLoading}
                data-testid="@authenticity-check/start-button"
            >
                <Translation id="TR_START_CHECK" />
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
            icon={ShieldCheckIcon}
            heading={getHeading()}
            description={getDescription()}
            innerActions={getInnerActions()}
            device={device}
            isConfirmedOnDevice={isWaitingForConfirmation}
            isActionAbortable
        >
            {!isCheckSuccessful && <ExplanationBeforeCheck />}
        </OnboardingCard>
    );
};
