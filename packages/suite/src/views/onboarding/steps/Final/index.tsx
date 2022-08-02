import React, { useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import useMeasure from 'react-use/lib/useMeasure';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Button, Icon, variables, Input, Dropdown, DropdownRef } from '@trezor/components';
import { Translation, HomescreenGallery } from '@suite-components';
import { DeviceAnimation, OnboardingStepBox } from '@onboarding-components';
import { useActions, useDevice, useOnboarding, useSelector } from '@suite-hooks';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { DEFAULT_LABEL, MAX_LABEL_LENGTH } from '@suite-constants/device';
import { getDeviceModel } from '@suite-utils/device';

const Option = styled.div`
    display: flex;
    padding: 10px 16px;
    height: 42px;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: 4px;
    align-items: center;
    cursor: pointer;
`;

const OptionIconWrapper = styled.div`
    margin-right: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const OptionText = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
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
    margin-bottom: 32px;
    padding-bottom: 32px;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
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
    const { applySettings } = useActions({
        applySettings: deviceSettingsActions.applySettings,
    });

    const { isLocked, device } = useDevice();
    const isDeviceLocked = isLocked();
    const { modal, onboardingAnalytics } = useSelector(state => ({
        modal: state.modal,
        onboardingAnalytics: state.onboarding.onboardingAnalytics,
    }));

    const [state, setState] = useState<'rename' | 'homescreen' | null>(null);
    const [label, setLabel] = useState('');

    const isWaitingForConfirm = modal.context === '@modal/context-device';

    const onRename = async () => {
        await applySettings({ label });
        setState(null);
    };

    const [wrapperRef, { width }] = useMeasure<HTMLDivElement>();

    if (!device?.features) return null;

    return (
        <OnboardingStepBox
            data-test="@onboarding/final"
            confirmOnDevice={isWaitingForConfirm ? device.features?.major_version : undefined}
        >
            <Wrapper ref={wrapperRef} shouldWrap={width < 650}>
                <DeviceImageWrapper>
                    <DeviceAnimation type="SUCCESS" size={400} device={device} />
                </DeviceImageWrapper>
                <Content>
                    <Heading>
                        <Translation id="TR_FINAL_HEADING" />
                    </Heading>
                    {!state && (
                        <SetupActions>
                            <Option onClick={() => setState('rename')}>
                                <OptionIconWrapper>
                                    <Icon size={16} icon="SIGN" />
                                </OptionIconWrapper>
                                <OptionText>
                                    <Translation id="TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL" />
                                </OptionText>
                            </Option>
                            <Dropdown
                                ref={dropdownRef}
                                alignMenu="right"
                                offset={16}
                                items={[
                                    {
                                        key: 'dropdown',
                                        options: [
                                            {
                                                key: 'gallery',
                                                label: (
                                                    <GalleryWrapper>
                                                        <HomescreenGallery
                                                            device={device}
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
                                <Option onClick={() => setState(null)}>
                                    <OptionIconWrapper>
                                        <Icon size={16} icon="DASHBOARD" />
                                    </OptionIconWrapper>
                                    <OptionText>
                                        <Translation id="TR_ONBOARDING_FINAL_CHANGE_HOMESCREEN" />
                                    </OptionText>
                                </Option>
                            </Dropdown>
                        </SetupActions>
                    )}
                    {state === 'rename' && (
                        <SetupActions>
                            <Input
                                noTopLabel
                                noError
                                value={label}
                                placeholder={DEFAULT_LABEL}
                                inputState={label.length > MAX_LABEL_LENGTH ? 'error' : undefined}
                                onChange={(event: React.FormEvent<HTMLInputElement>) =>
                                    setLabel(event.currentTarget.value)
                                }
                                data-test="@settings/device/label-input"
                            />
                            <Button
                                onClick={async () => {
                                    await onRename();
                                }}
                                isDisabled={
                                    isDeviceLocked || !label || label.length > MAX_LABEL_LENGTH
                                }
                                data-test="@settings/device/label-submit"
                            >
                                <Translation id="TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL" />
                            </Button>
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
                                device: getDeviceModel(device),
                            };
                            delete payload.startTime;

                            analytics.report({
                                type: EventType.DeviceSetupCompleted,
                                payload,
                            });
                        }}
                        icon="ARROW_RIGHT_LONG"
                        alignIcon="right"
                    >
                        <Translation id="TR_GO_TO_SUITE" />
                    </EnterSuiteButton>
                </Content>
            </Wrapper>
        </OnboardingStepBox>
    );
};
