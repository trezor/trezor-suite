import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Network } from 'src/types/wallet';

import {
    AmountUnitSwitchWrapper,
    CoinBalance,
    PriceTicker,
    Translation,
    TrendTicker,
} from 'src/components/suite';
import { isTestnet } from '@suite-common/wallet-utils';
import { CoinmarketBuyButton } from 'src/views/dashboard/components/CoinmarketBuyButton';
import { borders, spacingsPx, typography } from '@trezor/theme';

import { Card, H2, Icon, SkeletonRectangle, variables } from '@trezor/components';
import { useDispatch } from 'react-redux';
import { useAccountSearch, useLoadingSkeleton, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { AssetFiatBalance } from '@suite-common/assets';
import { FiatHeader } from '../../FiatHeader';
import { ArrowIcon, styledHoverOnParentOfArrowIcon } from './ArrowIcon';
import { AssetCardInfo, AssetCardInfoSkeleton } from './AssetCardInfo';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';

const StyledCard = styled(Card)`
    :hover {
        box-shadow: ${({ theme }) => theme.boxShadowElevated};
        cursor: pointer;
    }
    transition: box-shadow 0.2s;

    ${styledHoverOnParentOfArrowIcon}

    padding: ${spacingsPx.xs};
`;

const Content = styled.div`
    padding: ${spacingsPx.xs};
    flex: 1;
`;

const BuyContainerCard = styled(Card)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border-radius: ${borders.radii.xs};
    padding: ${spacingsPx.md};
`;

const WarningIcon = styled(Icon)`
    padding-left: ${spacingsPx.xxs};
    padding-bottom: ${spacingsPx.xxxs};
`;

const FiatAmount = styled.div`
    display: flex;
    align-content: flex-end;
`;

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

const AssetContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: ${spacingsPx.xxxl};
`;

const BuyContainerLabel = styled.div`
    ${typography.hint};
`;

const FailedContainer = styled.div`
    color: ${({ theme }) => theme.textAlertRed};
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
    ${typography.hint}

    ${variables.SCREEN_QUERY.MOBILE} {
        border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation1};
    }
`;

interface AssetCardProps {
    network: Network;
    failed: boolean;
    cryptoValue: string;
    assetsFiatBalances: AssetFiatBalance[];
    index?: number;
}

export const AssetCard = ({
    network,
    failed,
    cryptoValue,
    assetsFiatBalances,
    index,
}: AssetCardProps) => {
    const { symbol } = network;
    const dispatch = useDispatch();
    const theme = useTheme();
    const { setCoinFilter, setSearchString } = useAccountSearch();
    const localCurrency = useSelector(selectLocalCurrency);
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

    const { fiatAmount } = useFiatFromCryptoValue({ amount: cryptoValue, symbol });

    return (
        <StyledCard onClick={handleCardClick}>
            <Content>
                <AssetContainer>
                    <AssetCardInfo
                        network={network}
                        assetsFiatBalances={assetsFiatBalances}
                        index={index}
                    />
                    <ArrowIcon size={16} icon="ARROW_RIGHT_LONG" color={theme.iconDisabled} />
                </AssetContainer>
                {!failed ? (
                    <>
                        <FiatAmount>
                            <FiatHeader
                                size="medium"
                                portfolioValue={fiatAmount ?? '0'}
                                localCurrency={localCurrency}
                            />
                        </FiatAmount>
                        <CoinAmount>
                            <AmountUnitSwitchWrapper symbol={symbol}>
                                <CoinBalance value={cryptoValue} symbol={symbol} />
                            </AmountUnitSwitchWrapper>
                        </CoinAmount>
                    </>
                ) : (
                    <FailedContainer>
                        <WarningIcon icon="WARNING" color={theme.TYPE_RED} size={14} />
                        <Translation id="TR_DASHBOARD_ASSET_FAILED" />
                    </FailedContainer>
                )}
            </Content>
            {!isTestnet(symbol) && (
                <BuyContainerCard>
                    <div>
                        <BuyContainerLabel>
                            <Translation id="TR_EXCHANGE_RATE" />
                        </BuyContainerLabel>
                        <PriceTicker symbol={symbol} />
                    </div>
                    <div>
                        <BuyContainerLabel>
                            <Translation id="TR_7D_CHANGE" />
                        </BuyContainerLabel>
                        <TrendTicker symbol={symbol} />
                    </div>
                    <CoinmarketBuyButton
                        symbol={symbol}
                        dataTest={`@dashboard/assets/grid/${symbol}/buy-button`}
                    />
                </BuyContainerCard>
            )}
        </StyledCard>
    );
};

export const AssetCardSkeleton = (props: { animate?: boolean }) => {
    const { shouldAnimate } = useLoadingSkeleton();
    const animate = props.animate ?? shouldAnimate;

    return (
        <StyledCard>
            <Content>
                <AssetContainer>
                    <AssetCardInfoSkeleton animate={animate} />
                </AssetContainer>
                <FiatAmount>
                    <IntegerValue>
                        <SkeletonRectangle animate={animate} width={95} height={32} />
                    </IntegerValue>
                </FiatAmount>
                <CoinAmount>
                    <SkeletonRectangle animate={animate} width={50} height={16} />
                </CoinAmount>
            </Content>
            <BuyContainerCard>
                <SkeletonRectangle animate={animate} width="100%" height={40} />
            </BuyContainerCard>
        </StyledCard>
    );
};
