import { useEffect, useRef, useState } from 'react';
import { FormProvider } from 'react-hook-form';

import { startDiscoveryThunk } from '@suite-common/wallet-core';
import {
    Box,
    Button,
    Column,
    Divider,
    Flex,
    H2,
    Menu,
    Popover,
    PopoverRef,
    Row,
    Tooltip,
} from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { DeviceAnimation } from '@trezor/product-components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { OnboardingCard } from 'src/components/onboarding/OnboardingCard/OnboardingCard';
import { HomescreenGallery } from 'src/components/suite';
import { ChangeDeviceLabelForm } from 'src/components/suite/ChangeDeviceLabelForm';
import { Translation } from 'src/components/suite/Translation';
import { getHomescreens } from 'src/constants/suite/homescreens';
import { useDevice, useDispatch, useOnboarding, useSelector } from 'src/hooks/suite';
import { useChangeDeviceLabel } from 'src/hooks/suite/useChangeDeviceLabel';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { selectIsActionAbortable } from 'src/selectors/suite/suiteSelectors';
import { isHomescreenSupportedOnDevice } from 'src/utils/suite/homescreen';

export const FinalStep = () => {
    const { goToSuite } = useOnboarding();
    const popoverRef = useRef<PopoverRef>(undefined);
    const dispatch = useDispatch();
    const { isBelowTablet } = useLayoutSize();

    const { isLocked, device } = useDevice();
    const isDeviceLocked = isLocked();

    const modalContext = useSelector(state => state.modal.context);
    const onboardingAnalytics = useSelector(state => state.onboarding.onboardingAnalytics);
    const isActionAbortable = useSelector(selectIsActionAbortable);

    const [state, setState] = useState<'rename' | 'homescreen' | null>(null);

    const isWaitingForConfirm = modalContext === '@modal/context-device';

    const { form, handleSubmit } = useChangeDeviceLabel();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setState(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (device?.features === undefined) {
        return null;
    }

    const deviceModelInternal = device.features.internal_model;

    const shouldOfferChangeHomescreen = isHomescreenSupportedOnDevice(device);

    const reportAnalytics = () => {
        const payload = {
            ...onboardingAnalytics,
            duration: Date.now() - onboardingAnalytics.startTime!,
            device: device.features.internal_model,
            unitPackaging: device.features.unit_packaging ?? 0,
        };
        delete payload.startTime;

        analytics.report({
            type: EventType.DeviceSetupCompleted,
            payload,
        });
    };

    const handleRename = async () => await handleSubmit(() => setState(null));

    const handleGoToSuite = async () => {
        reportAnalytics();
        await handleSubmit();
        goToSuite();
        dispatch(startDiscoveryThunk({ device }));
    };

    const isBitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);
    const hasGallery = getHomescreens(isBitcoinOnlyFirmware)[deviceModelInternal].length > 0;

    return (
        <OnboardingCard
            data-testid="@onboarding/final"
            device={device}
            isConfirmedOnDevice={isWaitingForConfirm}
            isActionAbortable={isActionAbortable}
            padding={{ horizontal: 24, top: 16, bottom: 0 }}
        >
            <Flex gap={24} alignItems="center" direction={isBelowTablet ? 'column' : 'row'}>
                <Box>
                    <DeviceAnimation
                        type="SUCCESS"
                        height="400px"
                        width="400px"
                        deviceModelInternal={deviceModelInternal}
                    />
                </Box>
                <Column gap={32} alignItems={isBelowTablet ? 'center' : 'flex-start'}>
                    <H2>
                        <Translation id="TR_FINAL_HEADING" />
                    </H2>
                    {!state && (
                        <Row gap={12}>
                            <Button
                                variant="tertiary"
                                size="small"
                                icon="pencil"
                                onClick={() => setState('rename')}
                                isDisabled={isWaitingForConfirm}
                            >
                                <Translation id="TR_ONBOARDING_DEVICE_EDIT_LABEL" />
                            </Button>

                            {hasGallery && (
                                <Tooltip
                                    maxWidth={285}
                                    content={
                                        !shouldOfferChangeHomescreen && (
                                            <Translation id="TR_UPDATE_FIRMWARE_HOMESCREEN_LATER_TOOLTIP" />
                                        )
                                    }
                                >
                                    <Popover
                                        ref={popoverRef}
                                        placement={{ position: 'bottom', alignment: 'end' }}
                                        content={
                                            <Menu
                                                maxWidth={450}
                                                content={
                                                    <HomescreenGallery
                                                        onConfirm={() => {
                                                            popoverRef.current?.close();
                                                        }}
                                                    />
                                                }
                                            />
                                        }
                                    >
                                        <Button
                                            variant="tertiary"
                                            size="small"
                                            onClick={() => setState(null)}
                                            icon="chartBar"
                                            isDisabled={
                                                !shouldOfferChangeHomescreen || isWaitingForConfirm
                                            }
                                        >
                                            <Translation id="TR_ONBOARDING_FINAL_CHANGE_HOMESCREEN" />
                                        </Button>
                                    </Popover>
                                </Tooltip>
                            )}
                        </Row>
                    )}
                    {state === 'rename' && (
                        <FormProvider {...form}>
                            <ChangeDeviceLabelForm
                                isDeviceLocked={isDeviceLocked}
                                onClick={handleRename}
                            />
                        </FormProvider>
                    )}
                    <Divider />
                    <Button
                        variant="primary"
                        data-testid="@onboarding/exit-app-button"
                        onClick={handleGoToSuite}
                        icon="arrowRight"
                        iconAlignment="end"
                        isDisabled={isWaitingForConfirm}
                        size="large"
                        minWidth={180}
                    >
                        <Translation id="TR_GO_TO_SUITE" />
                    </Button>
                </Column>
            </Flex>
        </OnboardingCard>
    );
};
