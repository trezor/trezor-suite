import { useEffect, useMemo, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { variables, H3, IconLegacy, Card } from '@trezor/components';
import { DashboardSection } from 'src/components/dashboard';
import { Translation, StakingFeature, Divider } from 'src/components/suite';
import { Footer } from './components/Footer';
import { useDevice, useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { useAccounts } from 'src/hooks/wallet';
import { MIN_ETH_BALANCE_FOR_STAKING } from 'src/constants/suite/ethStaking';
import { spacingsPx, borders } from '@trezor/theme';
import { selectEnabledNetworks } from 'src/reducers/wallet/settingsReducer';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';
import { setFlag } from 'src/actions/suite/suiteActions';
import { selectPoolStatsApyData } from '@suite-common/wallet-core';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

const Flex = styled.div`
    display: flex;
    gap: ${spacingsPx.sm};
    align-items: center;
`;

const Badge = styled.span`
    padding: 9px ${spacingsPx.xs} ${spacingsPx.xs};
    border-radius: ${borders.radii.full};
    background: ${({ theme }) => theme.backgroundPrimarySubtleOnElevation1};
    color: ${({ theme }) => theme.textPrimaryDefault};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    line-height: 16px;
    max-height: 32px;
`;

const StyledCard = styled(Card)`
    flex-direction: column;
`;

const Body = styled.div`
    padding: ${spacingsPx.xxl} ${spacingsPx.xxl} 0 ${spacingsPx.xxl};
`;

const CardTitle = styled(H3)`
    color: ${({ theme }) => theme.textPrimaryDefault};
    line-height: 23px;
`;

const FlexRow = styled.div`
    display: flex;
    justify-content: space-between;
    margin: ${spacingsPx.xl} 0 ${spacingsPx.lg};
    gap: 68px;
    flex-wrap: wrap;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        flex-direction: column;
        gap: ${spacingsPx.md};
    }
`;

const FlexRowChild = styled.div`
    flex: 1 0 200px;
`;

const bannerSymbol = 'eth';

export const StakeEthCard = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const { showDashboardStakingPromoBanner } = useSelector(selectSuiteFlags);
    const { device } = useDevice();
    const isBitcoinOnlyDevice = hasBitcoinOnlyFirmware(device);

    const closeBanner = () => {
        dispatch(setFlag('showDashboardStakingPromoBanner', false));
    };

    const isBannerSymbolEnabled =
        enabledNetworks.includes(bannerSymbol) &&
        showDashboardStakingPromoBanner &&
        !isBitcoinOnlyDevice;

    const ethApy = useSelector(state => selectPoolStatsApyData(state, bannerSymbol));

    const { discovery } = useDiscovery();
    const { accounts } = useAccounts(discovery);
    const ethAccountWithSufficientBalanceForStaking = accounts.find(
        ({ symbol, formattedBalance }) =>
            symbol === bannerSymbol &&
            MIN_ETH_BALANCE_FOR_STAKING.isLessThanOrEqualTo(formattedBalance),
    );

    const [isShown, setIsShown] = useState(isBannerSymbolEnabled);

    useEffect(() => {
        setIsShown(isBannerSymbolEnabled);
    }, [isBannerSymbolEnabled]);

    const stakeEthFeatures = useMemo(
        () => [
            {
                id: 0,
                icon: <IconLegacy icon="PIGGY_BANK" size={32} color={theme.iconPrimaryDefault} />,
                title: <Translation id="TR_STAKE_ETH_SEE_MONEY_DANCE" />,
                description: (
                    <Translation
                        id="TR_STAKE_ETH_SEE_MONEY_DANCE_DESC"
                        values={{
                            apyPercent: ethApy,
                        }}
                    />
                ),
                extraDescription: <Translation id="TR_STAKE_APY_DESC" />,
            },
            {
                id: 1,
                icon: (
                    <IconLegacy
                        icon="LOCK_LAMINATED_OPEN"
                        size={32}
                        color={theme.iconPrimaryDefault}
                    />
                ),
                title: <Translation id="TR_STAKE_ETH_LOCK_FUNDS" />,
                description: <Translation id="TR_STAKE_ETH_LOCK_FUNDS_DESC" />,
            },
            {
                id: 2,
                icon: (
                    <IconLegacy icon="TREND_UP_THIN" size={32} color={theme.iconPrimaryDefault} />
                ),
                title: <Translation id="TR_STAKE_ETH_MAXIMIZE_REWARDS" />,
                description: <Translation id="TR_STAKE_ETH_MAXIMIZE_REWARDS_DESC" />,
            },
        ],
        [ethApy, theme.iconPrimaryDefault],
    );

    if (!isShown) return null;

    return (
        <>
            <DashboardSection
                heading={
                    <Flex>
                        <Translation id="TR_STAKE_ETH" />
                        <Badge>
                            <Translation id="TR_STAKE_ETH_BADGE" />
                        </Badge>
                    </Flex>
                }
            >
                <StyledCard paddingType="none">
                    <Body>
                        <CardTitle>
                            <Translation
                                id="TR_STAKE_ETH_CARD_TITLE"
                                values={{ symbol: bannerSymbol.toUpperCase() }}
                            />
                            <br />
                            <Translation id="TR_STAKE_ETH_EARN_REPEAT" />
                        </CardTitle>

                        <FlexRow>
                            {stakeEthFeatures.map(
                                ({ id, icon, title, description, extraDescription }) => (
                                    <FlexRowChild key={id}>
                                        <StakingFeature
                                            icon={icon}
                                            title={title}
                                            description={description}
                                            extraDescription={extraDescription}
                                        />
                                    </FlexRowChild>
                                ),
                            )}
                        </FlexRow>
                    </Body>

                    <Footer
                        accountIndex={ethAccountWithSufficientBalanceForStaking?.index}
                        hideSection={closeBanner}
                    />
                </StyledCard>
            </DashboardSection>

            <Divider />
        </>
    );
};
