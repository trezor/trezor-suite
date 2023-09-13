import { useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import useMeasure from 'react-use/lib/useMeasure';
import { analytics, EventType } from '@trezor/suite-analytics';

import {
    Button,
    Icon,
    variables,
    Dropdown,
    DropdownRef,
    Tooltip,
    DeviceAnimation,
} from '@trezor/components';
import { Translation, HomescreenGallery } from 'src/components/suite';
import { OnboardingStepBox } from 'src/components/onboarding';
import { useDevice, useOnboarding, useSelector } from 'src/hooks/suite';
import { DEFAULT_LABEL } from 'src/constants/suite/device';
import { isHomescreenSupportedOnDevice } from 'src/utils/suite/homescreen';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { ChangeDeviceLabel } from 'src/components/suite/ChangeDeviceLabel';

const StyledButton = styled(Button)`
    display: flex;
    padding: 10px 16px;
    height: 42px;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: 4px;
    align-items: center;
    cursor: pointer;
    background-color: transparent;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    :not(:disabled) {
        color: ${({ theme }) => theme.TYPE_DARK_GREY};
    }
    :hover,
    :focus {
        background-color: transparent;
        color: initial;
    }
`;

const StyledIcon = styled(Icon)`
    margin-right: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const Content = styled.div`
    flex-direction: column;
    flex: 1;
    display: flex;
`;

const GalleryWrapper = styled.div`
    width: 330px;
    padding: 8px 0px;
    height: 200px;
    overflow-y: auto;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

const DeviceImageWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 400px;
    height: 400px;
    margin: 0 20px 0 -60px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 0;
        width: 200px;
        height: 320px;
    }
`;

const Heading = styled.div`
    font-size: 48px;
    font-weight: ${variables.FONT_WEIGHT.BOLD};
    margin-bottom: 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        font-size: 32px;
    }
`;

const SetupActions = styled.div`
    display: flex;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 32px;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    width: fit-content;
    gap: 16px;
`;

const EnterSuiteButton = styled(Button)`
    height: 64px;
    min-width: 280px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    align-self: flex-start;
    justify-content: space-between;
    padding-left: 26px;
    padding-right: 26px;
`;

const Wrapper = styled.div<{ shouldWrap?: boolean }>`
    display: flex;
    width: 100%;
    align-items: center;

    ${({ shouldWrap }) =>
        shouldWrap &&
        css`
            padding: 0;
            margin: 0;
            flex-direction: column;

            ${DeviceImageWrapper} {
                margin: 0 0 20px 0;
            }

            ${Heading} {
                text-align: center;
            }

            ${SetupActions} {
                justify-content: center;
                width: auto;
            }

            ${EnterSuiteButton} {
                width: 100%;
            }
        `}
`;

export const FinalStep = () => {
    const { goToSuite } = useOnboarding();

    const dropdownRef = useRef<DropdownRef>();

    const { isLocked, device } = useDevice();
    const isDeviceLocked = isLocked();

    const modalContext = useSelector(state => state.modal.context);
    const onboardingAnalytics = useSelector(state => state.onboarding.onboardingAnalytics);
    const isActionAbortable = useSelector(selectIsActionAbortable);

    const deviceModelInternal = device?.features?.internal_model;

    const [state, setState] = useState<'rename' | 'homescreen' | null>(null);

    const isWaitingForConfirm = modalContext === '@modal/context-device';

    const onClick = () => {
        setState(null);
    };

    const [wrapperRef, { width }] = useMeasure<HTMLDivElement>();

    if (!device?.features) return null;

    const shouldOfferChangeHomescreen = isHomescreenSupportedOnDevice(device);

    return (
        <OnboardingStepBox
            data-test="@onboarding/final"
            deviceModelInternal={isWaitingForConfirm ? deviceModelInternal : undefined}
            isActionAbortable={isActionAbortable}
        >
            <Wrapper ref={wrapperRef} shouldWrap={width < 650}>
                <DeviceImageWrapper>
                    <DeviceAnimation
                        type="SUCCESS"
                        size={400}
                        deviceModelInternal={deviceModelInternal}
                    />
                </DeviceImageWrapper>
                <Content>
                    <Heading>
                        <Translation id="TR_FINAL_HEADING" />
                    </Heading>
                    {!state && (
                        <SetupActions>
                            <StyledButton
                                onClick={() => setState('rename')}
                                isDisabled={isWaitingForConfirm}
                            >
                                <StyledIcon size={16} icon="PENCIL" />
                                <Translation id="TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL" />
                            </StyledButton>

                            <Tooltip
                                maxWidth={285}
                                content={
                                    !shouldOfferChangeHomescreen && (
                                        <Translation id="TR_UPDATE_FIRMWARE_HOMESCREEN_LATER_TOOLTIP" />
                                    )
                                }
                            >
                                <Dropdown
                                    ref={dropdownRef}
                                    alignMenu="right"
                                    offset={16}
                                    isDisabled={!shouldOfferChangeHomescreen || isWaitingForConfirm}
                                    items={[
                                        {
                                            key: 'dropdown',
                                            options: [
                                                {
                                                    key: 'gallery',
                                                    label: (
                                                        <GalleryWrapper>
                                                            <HomescreenGallery
                                                                onConfirm={() => {
                                                                    dropdownRef.current?.close();
                                                                }}
                                                            />
                                                        </GalleryWrapper>
                                                    ),
                                                    noPadding: true,
                                                    noHover: true, // no hover effect
                                                    callback: () => false, // don't close Dropdown on mouse click automatically
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    <StyledButton onClick={() => setState(null)}>
                                        <StyledIcon size={16} icon="DASHBOARD" />
                                        <Translation id="TR_ONBOARDING_FINAL_CHANGE_HOMESCREEN" />
                                    </StyledButton>
                                </Dropdown>
                            </Tooltip>
                        </SetupActions>
                    )}
                    {state === 'rename' && (
                        <SetupActions>
                            <ChangeDeviceLabel
                                placeholder={DEFAULT_LABEL}
                                onClick={onClick}
                                isDeviceLocked={isDeviceLocked}
                            />
                        </SetupActions>
                    )}

                    <EnterSuiteButton
                        variant="secondary"
                        data-test="@onboarding/exit-app-button"
                        onClick={() => {
                            goToSuite(true);

                            const payload = {
                                ...onboardingAnalytics,
                                duration: Date.now() - onboardingAnalytics.startTime!,
                                device: device.features.internal_model,
                            };
                            delete payload.startTime;

                            analytics.report({
                                type: EventType.DeviceSetupCompleted,
                                payload,
                            });
                        }}
                        icon="ARROW_RIGHT_LONG"
                        alignIcon="right"
                        isDisabled={isWaitingForConfirm}
                    >
                        <Translation id="TR_GO_TO_SUITE" />
                    </EnterSuiteButton>
                </Content>
            </Wrapper>
        </OnboardingStepBox>
    );
};
