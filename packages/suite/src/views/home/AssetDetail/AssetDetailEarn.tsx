import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetAmount,
    selectWalletAssetAvailableAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetStakingAmount,
    selectWalletAssetStakingRatio,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { getNetworkType } from '@suite-common/wallet-config';
import { type WalletAssetKey, isSupportedStakingNetworkSymbol } from '@suite-common/wallet-core';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Box, Card, Column, Row, SegmentedBar, Text, TextButton } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ArrowRightIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { type Color } from '@trezor/theme';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { useFormatApy } from 'src/hooks/earn/useFormatApy';
import { useStakingRate } from 'src/hooks/earn/useStakingRate';
import { useSelector } from 'src/hooks/suite';

import { AssetDetailEarnLegendSquare } from './AssetDetailEarnLegendSquare';

const AVAILABLE_COLOR = 'elementFillAccentVioletBold' satisfies Color;
const UNSTAKED_COLOR = 'elementFillNeutralSoft' satisfies Color;
const STAKING_COLOR = 'elementFillBrandBold' satisfies Color;

type AssetDetailEarnProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailEarn = ({ assetKey }: AssetDetailEarnProps) => {
    const { dispatch } = useServices(injectDispatch);
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const amount = useSelector(state => selectWalletAssetAmount(state, assetKey));
    const availableAmount = useSelector(state => selectWalletAssetAvailableAmount(state, assetKey));
    const stakingAmount = useSelector(state => selectWalletAssetStakingAmount(state, assetKey));
    const stakingRatio = useSelector(state => selectWalletAssetStakingRatio(state, assetKey)) ?? 0;
    // The rate staking pays on the network, Tron's included, as the trade box and Earn show it.
    const { rate: apy } = useStakingRate({ symbol });
    const formatApy = useFormatApy();

    if (
        symbol === undefined ||
        contractAddress !== undefined ||
        !isSupportedStakingNetworkSymbol(symbol) ||
        amount === undefined ||
        !isPositiveBalance(amount) ||
        availableAmount === undefined
    ) {
        return null;
    }

    // A Cardano delegation leaves the whole balance spendable, so the rest is unstaked, not the
    // only part available.
    const isCardano = getNetworkType(symbol) === 'cardano';
    const unstakedColor = isCardano ? UNSTAKED_COLOR : AVAILABLE_COLOR;

    return (
        <Box flex="1" minWidth={280}>
            <Card paddingType="none" height="100%" data-testid="@asset-detail/earn">
                <Box padding={20}>
                    <Column gap={16} alignItems="stretch">
                        <Row justifyContent="space-between" alignItems="center">
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation id="TR_EARN" />
                            </Text>
                            <TextButton
                                size="small"
                                iconRight={ArrowRightIcon}
                                onClick={() => dispatch(gotoThunk({ routeName: 'suite-earn' }))}
                                data-testid="@asset-detail/earn/view-all"
                            >
                                <Translation id="TR_VIEW_ALL" />
                            </TextButton>
                        </Row>
                        <SegmentedBar
                            segments={[
                                { value: 1 - stakingRatio, color: unstakedColor },
                                { value: stakingRatio, color: STAKING_COLOR },
                            ]}
                        />
                        <Row justifyContent="space-between" alignItems="center">
                            <Row gap={12} alignItems="center">
                                <AssetDetailEarnLegendSquare color={unstakedColor} />
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
                                <AssetDetailEarnLegendSquare color={STAKING_COLOR} />
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
