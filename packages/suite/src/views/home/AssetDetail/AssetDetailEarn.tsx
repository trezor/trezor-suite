import { useTheme } from 'styled-components';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetAvailableAmount,
    selectWalletAssetStakingAmount,
    selectWalletAssetStakingRatio,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { getNetworkType } from '@suite-common/wallet-config';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Box, Card, Column, Icon, ProgressBar, Row, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CaretRightIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { type Color } from '@trezor/theme';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { useFormatApy } from 'src/hooks/earn/useFormatApy';
import { useStakingRate } from 'src/hooks/earn/useStakingRate';
import { useSelector } from 'src/hooks/suite';

const AVAILABLE_COLOR = 'elementFillAccentVioletBold' satisfies Color;
const UNSTAKED_COLOR = 'elementFillNeutralSoft' satisfies Color;
const STAKING_COLOR = 'elementFillBrandBold' satisfies Color;

const LegendSquare = ({ color }: { color: Color }) => (
    <Box width={12} height={12} borderRadius={4} backgroundColor={color} />
);

type AssetDetailEarnProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailEarn = ({ assetKey }: AssetDetailEarnProps) => {
    const { dispatch } = useServices(injectDispatch);
    const theme = useTheme();
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const availableAmount = useSelector(state => selectWalletAssetAvailableAmount(state, assetKey));
    const stakingAmount = useSelector(state => selectWalletAssetStakingAmount(state, assetKey));
    const stakingRatio = useSelector(state => selectWalletAssetStakingRatio(state, assetKey));
    // The rate staking pays on the network, Tron's included, as the trade box and Earn show it.
    const { rate: apy } = useStakingRate({ symbol });
    const formatApy = useFormatApy();

    if (symbol === undefined || availableAmount === undefined || stakingRatio === undefined) {
        return null;
    }

    // A Cardano delegation leaves the whole balance spendable, so the rest is unstaked, not the
    // only part available.
    const isCardano = getNetworkType(symbol) === 'cardano';
    const unstakedColor = isCardano ? UNSTAKED_COLOR : AVAILABLE_COLOR;

    return (
        <Box flex="1" minWidth={280}>
            <Card
                paddingType="none"
                height="100%"
                onClick={() => dispatch(gotoThunk({ routeName: 'suite-earn' }))}
                data-testid="@asset-detail/earn"
            >
                <Box padding={20}>
                    <Column gap={16} alignItems="stretch">
                        <Row justifyContent="space-between" alignItems="center">
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation id="TR_EARN" />
                            </Text>
                            <Icon
                                as={CaretRightIcon}
                                size={16}
                                intent="neutral"
                                priority="secondary"
                            />
                        </Row>
                        <ProgressBar
                            value={stakingRatio}
                            max={1}
                            backgroundColor={theme[unstakedColor]}
                            foregroundColor={theme[STAKING_COLOR]}
                        />
                        <Row justifyContent="space-between" alignItems="center">
                            <Row gap={12} alignItems="center">
                                <LegendSquare color={unstakedColor} />
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation
                                        id={
                                            isCardano
                                                ? 'TR_ASSET_DETAIL_UNSTAKED'
                                                : 'TR_STAKE_AVAILABLE'
                                        }
                                    />
                                </Text>
                            </Row>
                            <Text typographyStyle="body-md-strong">
                                <BaseCurrencyValue amount={availableAmount} symbol={symbol} />
                            </Text>
                        </Row>
                        <Row justifyContent="space-between" alignItems="center">
                            <Row gap={12} alignItems="center">
                                <LegendSquare color={STAKING_COLOR} />
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="TR_STAKE_STAKED" />
                                </Text>
                            </Row>
                            <Row gap={12} alignItems="center">
                                {apy != null && apy > 0 && (
                                    <Text typographyStyle="body-sm" intent="brand">
                                        {/* Tron pays its rate as an APR, as its Earn modal says. */}
                                        {getNetworkType(symbol) === 'tron' ? (
                                            <Translation
                                                id="TR_EARN_APR_APPROX"
                                                values={{ aprPercent: formatApy(apy) }}
                                            />
                                        ) : (
                                            <Translation
                                                id="TR_EARN_YIELD_BADGE_RATE"
                                                values={{ apy: formatApy(apy) }}
                                            />
                                        )}
                                    </Text>
                                )}
                                <Text typographyStyle="body-md-strong">
                                    <BaseCurrencyValue amount={stakingAmount} symbol={symbol} />
                                </Text>
                            </Row>
                        </Row>
                    </Column>
                </Box>
            </Card>
        </Box>
    );
};
