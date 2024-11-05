import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Network } from '@suite-common/wallet-config';

import {
    AmountUnitSwitchWrapper,
    CoinBalance,
    PriceTicker,
    Translation,
    TrendTicker,
} from 'src/components/suite';
import { spacings, spacingsPx, typography } from '@trezor/theme';

import {
    Card,
    Column,
    H2,
    Icon,
    Row,
    SkeletonRectangle,
    variables,
    Text,
} from '@trezor/components';
import { useDispatch } from 'react-redux';
import { useAccountSearch, useLoadingSkeleton, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { AssetFiatBalance } from '@suite-common/assets';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { ArrowIcon, styledHoverOnParentOfArrowIcon } from '../ArrowIcon';
import { CoinmarketBuyButton } from '../CoinmarketBuyButton';
import { AssetCardInfo, AssetCardInfoSkeleton } from './AssetCardInfo';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { TokenInfo } from '@trezor/connect';
import { Account, RatesByKey } from '@suite-common/wallet-types';
import { AssetCardTokensAndStakingInfo } from './AssetCardTokensAndStakingInfo';
import { isTestnet } from '@suite-common/wallet-utils';
import { selectAssetAccountsThatStaked } from '@suite-common/wallet-core';
import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { handleTokensAndStakingData } from '../assetsViewUtils';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.2s;
    ${styledHoverOnParentOfArrowIcon};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const WarningIcon = styled(Icon)`
    padding-left: ${spacingsPx.xxs};
    padding-bottom: ${spacingsPx.xxxs};
`;

const FiatAmount = styled.div`
    display: flex;
    align-content: flex-end;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const IntegerValue = styled(H2)`
    font-variant-numeric: tabular-nums;
    line-height: 34px;
    letter-spacing: 0.565px;
`;

const CoinAmount = styled.div`
    color: ${({ theme }) => theme.textSubdued};
    display: inline-block;
    margin-top: ${spacingsPx.xs};
    font-variant-numeric: tabular-nums;
    ${typography.hint};
`;

const FailedContainer = styled.div`
    color: ${({ theme }) => theme.textAlertRed};
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
    ${typography.hint}

    ${variables.SCREEN_QUERY.MOBILE} {
        border-bottom: 1px solid ${({ theme }) => theme.borderElevation2};
    }
`;

type AssetCardProps = {
    network: Network;
    failed: boolean;
    cryptoValue: string;
    assetsFiatBalances: AssetFiatBalance[];
    stakingAccounts: Account[];
    assetTokens: TokenInfo[];
    index?: number;
    localCurrency: FiatCurrencyCode;
    currentFiatRates?: RatesByKey;
    accounts: Account[];
};

export const AssetCard = ({
    network,
    failed,
    cryptoValue,
    assetsFiatBalances,
    stakingAccounts,
    assetTokens,
    index,
    localCurrency,
    currentFiatRates,
    accounts,
}: AssetCardProps) => {
    const { symbol } = network;
    const dispatch = useDispatch();
    const theme = useTheme();
    const { setCoinFilter, setSearchString } = useAccountSearch();
    const handleCardClick = () => {
        dispatch(
            goto('wallet-index', {
                params: {
                    symbol,
                    accountIndex: 0,
                    accountType: 'normal',
                },
            }),
        );
        // activate coin filter and reset account search string
        setCoinFilter(symbol);
        setSearchString(undefined);
    };

    const stakingAccountsForAsset = stakingAccounts.filter(account => account.symbol === symbol);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));
    const { fiatAmount } = useFiatFromCryptoValue({ amount: cryptoValue, symbol });
    const accountsThatStaked = useSelector(state =>
        selectAssetAccountsThatStaked(state, stakingAccountsForAsset),
    );

    const { tokensFiatBalance, assetStakingBalance, shouldRenderStakingRow, shouldRenderTokenRow } =
        handleTokensAndStakingData(
            assetTokens,
            accountsThatStaked,
            symbol,
            localCurrency,
            coinDefinitions,
            currentFiatRates,
        );

    return (
        <StyledCard paddingType="small" onClick={handleCardClick}>
            <Column
                gap={spacings.xxxl}
                alignItems="flex-start"
                flex="1"
                margin={{
                    top: spacings.xs,
                    bottom: spacings.xs,
                    left: spacings.xs,
                    right: spacings.xs,
                }}
            >
                <Row justifyContent="space-between">
                    <AssetCardInfo
                        network={network}
                        assetsFiatBalances={assetsFiatBalances}
                        index={index}
                    />
                    <ArrowIcon size={16} name="arrowRightLong" color={theme.iconDisabled} />
                </Row>
                {!failed ? (
                    <Column alignItems="flex-start">
                        <FiatAmount>
                            <FiatHeader
                                size="medium"
                                fiatAmount={fiatAmount ?? '0'}
                                localCurrency={localCurrency}
                            />
                        </FiatAmount>
                        <CoinAmount>
                            <AmountUnitSwitchWrapper symbol={symbol}>
                                <CoinBalance value={cryptoValue} symbol={symbol} />
                            </AmountUnitSwitchWrapper>
                        </CoinAmount>
                    </Column>
                ) : (
                    <FailedContainer>
                        <WarningIcon
                            name="warningTriangle"
                            color={theme.legacy.TYPE_RED}
                            size={14}
                        />
                        <Translation id="TR_DASHBOARD_ASSET_FAILED" />
                    </FailedContainer>
                )}
            </Column>
            {(shouldRenderStakingRow || shouldRenderTokenRow) && (
                <AssetCardTokensAndStakingInfo
                    symbol={symbol}
                    tokensFiatBalance={tokensFiatBalance.toString()}
                    assetStakingBalance={assetStakingBalance.toString()}
                    shouldRenderStaking={shouldRenderStakingRow}
                    shouldRenderTokens={shouldRenderTokenRow}
                    accounts={accounts}
                />
            )}
            {!isTestnet(symbol) && (
                <Card>
                    <Row alignItems="center" justifyContent="space-between">
                        <div>
                            <Text typographyStyle="hint">
                                <Translation id="TR_EXCHANGE_RATE" />
                            </Text>
                            <PriceTicker symbol={symbol} />
                        </div>
                        <div>
                            <Text typographyStyle="hint">
                                <Translation id="TR_7D_CHANGE" />
                            </Text>
                            <TrendTicker symbol={symbol} />
                        </div>
                        <CoinmarketBuyButton
                            symbol={symbol}
                            data-testid={`@dashboard/assets/grid/${symbol}/buy-button`}
                        />
                    </Row>
                </Card>
            )}
        </StyledCard>
    );
};

export const AssetCardSkeleton = (props: { animate?: boolean }) => {
    const { shouldAnimate } = useLoadingSkeleton();
    const animate = props.animate ?? shouldAnimate;

    return (
        <StyledCard>
            <Column
                gap={spacings.xxxl}
                alignItems="flex-start"
                flex="1"
                margin={{
                    top: spacings.xs,
                    bottom: spacings.xs,
                    left: spacings.xs,
                    right: spacings.xs,
                }}
            >
                <Row justifyContent="space-between" margin={{ bottom: spacings.xxxl }}>
                    <AssetCardInfoSkeleton animate={animate} />
                </Row>
                <FiatAmount>
                    <IntegerValue>
                        <SkeletonRectangle animate={animate} width={95} height={32} />
                    </IntegerValue>
                </FiatAmount>
                <CoinAmount>
                    <SkeletonRectangle animate={animate} width={50} height={16} />
                </CoinAmount>
            </Column>
            <Card>
                <SkeletonRectangle animate={animate} width="100%" height={40} />
            </Card>
        </StyledCard>
    );
};
