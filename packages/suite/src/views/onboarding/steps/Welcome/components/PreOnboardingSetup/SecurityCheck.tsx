import React from 'react';
import styled from 'styled-components';
import { Icon, Tooltip, variables } from '@trezor/components';
import { useOnboarding, useSelector, useTheme } from '@suite-hooks';
import { Translation, TrezorLink } from '@suite-components';
import { Box, Hologram, OnboardingButton } from '@onboarding-components';
import { SUPPORT_URL } from '@suite-constants/urls';
import { getConnectedDeviceStatus } from '@suite-utils/device';

const Items = styled.div`
    display: flex;
    flex-direction: column;
`;
const Item = styled.div`
    display: flex;
    align-items: center;

    & + & {
        margin-top: 24px;
    }
`;

const Underline = styled.span`
    /* text-decoration: dashed; */
    text-decoration: underline;
    text-decoration-style: dashed;
`;

const Buttons = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const Text = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-left: 24px;
`;

const StyledButton = styled(OnboardingButton.Cta)`
    margin-right: 16px;
`;

const StyledTooltip = styled(Tooltip)`
    display: inline-block;
`;

const SecurityCheck = () => {
    const { goToNextStep, goto } = useOnboarding();
    const { device } = useSelector(s => ({
        device: s.suite.device,
    }));

    const deviceStatus = getConnectedDeviceStatus(device);
    const initialized = deviceStatus === 'initialized';
    const firmwareNotInstalled = device?.firmware === 'none';
    const { theme } = useTheme();

    const items = [
        {
            key: 1,
            show: firmwareNotInstalled,
            icon: 'HOLOGRAM',
            content: (
                <Translation
                    id="TR_ONBOARDING_DEVICE_CHECK_1"
                    values={{
                        strong: chunks => (
                            <StyledTooltip
                                content={
                                    <Hologram
                                        trezorModel={device?.features?.major_version === 1 ? 1 : 2}
                                    />
                                }
                            >
                                <Underline>{chunks}</Underline>
                            </StyledTooltip>
                        ),
                    }}
                />
            ),
        },
        {
            key: 2,
            show: firmwareNotInstalled,
            icon: 'VERIFIED',
            content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_2" />,
        },
        {
            key: 3,
            show: firmwareNotInstalled,
            icon: 'PACKAGE',
            content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_3" />,
        },
        {
            // Device was used, shows only when fw installed
            key: 4,
            show: !firmwareNotInstalled,
            icon: 'PACKAGE',
            content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_4" />,
        },
    ] as const;

    return (
        <Box variant="small" image="PIN" heading={<Translation id="TR_ONBOARDING_DEVICE_CHECK" />}>
            <Items>
                {items
                    .filter(item => item.show)
                    .map(item => (
                        <Item key={item.key}>
                            <Icon size={24} icon={item.icon} color={theme.TYPE_DARK_GREY} />
                            <Text>{item.content}</Text>
                        </Item>
                    ))}
            </Items>

            <Buttons>
                {initialized ? (
                    <StyledButton
                        data-test="@onboarding/exit-app-button"
                        onClick={() => goto('suite-index')}
                    >
                        <Translation id="TR_GO_TO_SUITE" />
                    </StyledButton>
                ) : (
                    <StyledButton
                        onClick={() => goToNextStep()}
                        data-test="@onboarding/continue-button"
                    >
                        <Translation id="TR_ONBOARDING_START_CTA" />
                    </StyledButton>
                )}
                <TrezorLink variant="nostyle" href={SUPPORT_URL}>
                    <OnboardingButton.Cta variant="secondary" fullWidth>
                        <Translation id="TR_CONTACT_SUPPORT" />
                    </OnboardingButton.Cta>
                </TrezorLink>
            </Buttons>
        </Box>
    );
};

export default SecurityCheck;
