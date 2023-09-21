import styled from 'styled-components';

import { getConnectedDeviceStatus } from '@suite-common/suite-utils';
import { TREZOR_SUPPORT_URL } from '@trezor/urls';
import { Icon, Tooltip, variables, useTheme } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';

import { useOnboarding, useSelector } from 'src/hooks/suite';
import { Translation, TrezorLink } from 'src/components/suite';
import { Hologram, OnboardingButtonCta, OnboardingButtonSkip } from 'src/components/onboarding';
import { CollapsibleOnboardingCard } from 'src/components/onboarding/CollapsibleOnboardingCard';

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
    text-decoration: underline;
    text-decoration-style: dashed;
`;

const HowLong = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

const Text = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-left: 24px;
`;

const StyledTooltip = styled(Tooltip)`
    display: inline-block;

    ${variables.SCREEN_QUERY.MOBILE} {
        pointer-events: none;

        span {
            text-decoration: none;
        }
    }
`;

const OuterActions = styled.div`
    display: flex;
    margin-top: 40px;
    width: 100%;
    justify-content: center;
`;

export const SecurityCheck = () => {
    const { goToNextStep, goToSuite, rerun, updateAnalytics } = useOnboarding();
    const recovery = useSelector(state => state.recovery);
    const device = useSelector(selectDevice);
    const theme = useTheme();

    const deviceStatus = getConnectedDeviceStatus(device);
    const initialized = deviceStatus === 'initialized';
    const firmwareInstalled = device?.firmware !== 'none';

    const items = [
        {
            key: 1,
            show: !firmwareInstalled,
            icon: 'HOLOGRAM',
            content: (
                <Translation
                    id="TR_ONBOARDING_DEVICE_CHECK_1"
                    values={{
                        strong: chunks => (
                            <StyledTooltip
                                placement="left"
                                rich
                                content={<Hologram device={device} />}
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
            show: !firmwareInstalled,
            icon: 'VERIFIED',
            content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_2" />,
        },
        {
            key: 3,
            show: !firmwareInstalled,
            icon: 'PACKAGE',
            content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_3" />,
        },
        {
            // Device was used, shows only when fw installed
            key: 4,
            show: firmwareInstalled,
            icon: 'PACKAGE',
            content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_4" />,
        },
    ] as const;

    const visibleItems = items.filter(item => item.show);

    return (
        <>
            <CollapsibleOnboardingCard
                variant="small"
                image="PIN"
                heading={<Translation id="TR_ONBOARDING_DEVICE_CHECK" />}
            >
                <Items>
                    {visibleItems.map(item => (
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
                            onClick={() => goToSuite()}
                        >
                            <Translation id="TR_GO_TO_SUITE" />
                        </OnboardingButtonCta>
                    ) : (
                        <Items>
                            <OnboardingButtonCta
                                onClick={() => {
                                    if (recovery.status === 'in-progress') {
                                        rerun();
                                    } else {
                                        goToNextStep();
                                    }
                                    updateAnalytics({
                                        startTime: Date.now(),
                                    });
                                }}
                                data-test="@analytics/continue-button"
                            >
                                <Translation id="TR_ONBOARDING_START_CTA" />
                            </OnboardingButtonCta>
                            <HowLong>
                                <IconWrapper>
                                    <Icon size={12} icon="CLOCK_ACTIVE" />
                                </IconWrapper>
                                <Translation id="TR_TAKES_N_MINUTES" values={{ n: '5' }} />
                            </HowLong>
                        </Items>
                    )}
                </Buttons>
            </CollapsibleOnboardingCard>
            <OuterActions>
                <TrezorLink variant="underline" href={TREZOR_SUPPORT_URL}>
                    <OnboardingButtonSkip>
                        <Translation id="TR_SECURITY_CHECK_CONTACT_SUPPORT" />
                    </OnboardingButtonSkip>
                </TrezorLink>
            </OuterActions>
        </>
    );
};
