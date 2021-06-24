import React from 'react';
import styled from 'styled-components';
import { Icon, Tooltip, variables } from '@trezor/components';
import { useOnboarding, useSelector, useTheme } from '@suite-hooks';
import { Translation, TrezorLink } from '@suite-components';
import { Box, Hologram, OnboardingButtonCta, OnboardingButtonSkip } from '@onboarding-components';
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

const HowLong = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 16px;
`;

const IconWrapper = styled.div`
    margin-right: 6px;
`;

const Buttons = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
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

const StyledTooltip = styled(Tooltip)`
    display: inline-block;
`;

const OuterActions = styled.div`
    display: flex;
    margin-top: 40px;
    width: 100%;
    justify-content: center;
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
                            <StyledTooltip rich content={<Hologram device={device} />}>
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
        <>
            <Box
                variant="small"
                image="PIN"
                heading={<Translation id="TR_ONBOARDING_DEVICE_CHECK" />}
            >
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
                        <OnboardingButtonCta
                            data-test="@onboarding/exit-app-button"
                            onClick={() => goto('suite-index')}
                        >
                            <Translation id="TR_GO_TO_SUITE" />
                        </OnboardingButtonCta>
                    ) : (
                        <Items>
                            <OnboardingButtonCta
                                onClick={() => goToNextStep()}
                                data-test="@onboarding/continue-button"
                            >
                                <Translation id="TR_ONBOARDING_START_CTA" />
                            </OnboardingButtonCta>
                            <HowLong>
                                <IconWrapper>
                                    <Icon size={12} icon="CLOCK" />
                                </IconWrapper>
                                <Translation id="TR_TAKES_N_MINUTES" values={{ n: '5' }} />
                            </HowLong>
                        </Items>
                    )}
                </Buttons>
            </Box>
            <OuterActions>
                <TrezorLink variant="underline" href={SUPPORT_URL}>
                    <OnboardingButtonSkip>
                        <Translation id="TR_SECURITY_CHECK_CONTACT_SUPPORT" />
                    </OnboardingButtonSkip>
                </TrezorLink>
            </OuterActions>
        </>
    );
};

export default SecurityCheck;
