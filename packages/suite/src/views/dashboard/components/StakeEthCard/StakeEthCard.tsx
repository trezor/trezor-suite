import { useEffect, useMemo, useState } from 'react';
import {
    variables,
    Divider,
    H3,
    Icon,
    Card,
    Column,
    Tooltip,
    Grid,
    useMediaQuery,
    Paragraph,
} from '@trezor/components';
import { DashboardSection } from 'src/components/dashboard';
import { Translation, StakingFeature } from 'src/components/suite';
import { Footer } from './components/Footer';
import { useDevice, useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { useAccounts } from 'src/hooks/wallet';
import { MIN_ETH_BALANCE_FOR_STAKING } from 'src/constants/suite/ethStaking';
import { spacings } from '@trezor/theme';
import { selectEnabledNetworks } from 'src/reducers/wallet/settingsReducer';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';
import { setFlag } from 'src/actions/suite/suiteActions';
import { selectPoolStatsApyData } from '@suite-common/wallet-core';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

const bannerSymbol = 'eth';

export const StakeEthCard = () => {
    const dispatch = useDispatch();
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const { showDashboardStakingPromoBanner } = useSelector(selectSuiteFlags);
    const { device } = useDevice();
    const isBelowLaptop = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.LG})`);
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
                icon: <Icon name="piggyBank" size="extraLarge" variant="primary" />,
                title: <Translation id="TR_STAKE_ETH_SEE_MONEY_DANCE" />,
                description: (
                    <Translation
                        id="TR_STAKE_ETH_SEE_MONEY_DANCE_DESC"
                        values={{
                            apyPercent: ethApy,
                            t: text => (
                                <Tooltip
                                    dashed
                                    isInline
                                    content={<Translation id="TR_STAKE_APY_DESC" />}
                                >
                                    <abbr>{text}</abbr>
                                </Tooltip>
                            ),
                        }}
                    />
                ),
            },
            {
                id: 1,
                icon: <Icon name="lockLaminatedOpen" size="extraLarge" variant="primary" />,
                title: <Translation id="TR_STAKE_ETH_LOCK_FUNDS" />,
                description: <Translation id="TR_STAKE_ETH_LOCK_FUNDS_DESC" />,
            },
            {
                id: 2,
                icon: <Icon name="trendUp" size="extraLarge" variant="primary" />,
                title: <Translation id="TR_STAKE_ETH_MAXIMIZE_REWARDS" />,
                description: <Translation id="TR_STAKE_ETH_MAXIMIZE_REWARDS_DESC" />,
            },
        ],
        [ethApy],
    );

    if (!isShown) return null;

    return (
        <>
            <DashboardSection heading={<Translation id="TR_STAKE_ETH" />}>
                <Card>
                    <Column alignItems="stretch">
                        <Column alignItems="flex-start">
                            <H3>
                                <Translation
                                    id="TR_STAKE_ETH_CARD_TITLE"
                                    values={{ symbol: bannerSymbol.toUpperCase() }}
                                />
                            </H3>
                            <Paragraph>
                                <Translation id="TR_STAKE_ETH_EARN_REPEAT" />
                            </Paragraph>
                        </Column>

                        <Grid
                            columns={isBelowLaptop ? 1 : 3}
                            gap={isBelowLaptop ? spacings.xxxl : spacings.xxxxl}
                            margin={{ top: spacings.xxxxl, bottom: spacings.xxl }}
                        >
                            {stakeEthFeatures.map(({ id, icon, title, description }) => (
                                <StakingFeature
                                    key={id}
                                    icon={icon}
                                    title={title}
                                    description={description}
                                />
                            ))}
                        </Grid>

                        <Divider />

                        <Footer
                            accountIndex={ethAccountWithSufficientBalanceForStaking?.index}
                            hideSection={closeBanner}
                        />
                    </Column>
                </Card>
            </DashboardSection>
        </>
    );
};
