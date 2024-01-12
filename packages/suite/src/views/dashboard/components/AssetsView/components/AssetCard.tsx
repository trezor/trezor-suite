import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Network } from 'src/types/wallet';

import {
    AmountUnitSwitchWrapper,
    CoinBalance,
    PriceTicker,
    SkeletonRectangle,
    Translation,
    TrendTicker,
} from 'src/components/suite';
import { isTestnet } from '@suite-common/wallet-utils';
import { CoinmarketBuyButton } from 'src/views/dashboard/components/CoinmarketBuyButton';
import { borders, spacingsPx, typography } from '@trezor/theme';

import { H2, Icon, variables } from '@trezor/components';
import { useDispatch } from 'react-redux';
import { useAccountSearch, useLoadingSkeleton } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { ArrowIcon, AssetInfo, AssetInfoSkeleton } from './AssetInfo';
import { AssetFiatBalance } from '@suite-common/assets';
import { FiatHeader } from '../../FiatHeader';

const BuyContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation2};
    border-radius: ${borders.radii.xs};
    padding: ${spacingsPx.sm} ${spacingsPx.sm} ${spacingsPx.sm} ${spacingsPx.md};
`;

const WarningIcon = styled(Icon)`
    padding-left: ${spacingsPx.xxs};
    padding-bottom: ${spacingsPx.xxxs};
`;

const BuyMarginContainer = styled.div`
    margin: 0 ${spacingsPx.xs} ${spacingsPx.xs} ${spacingsPx.xs};
`;

const MarginContainer = styled.div`
    padding: ${spacingsPx.md} ${spacingsPx.sm} ${spacingsPx.sm} ${spacingsPx.md};
    flex: 1;
`;

const Card = styled.div`
    border-radius: ${borders.radii.md};
    box-shadow: ${({ theme }) => theme.boxShadowElevation1};

    :hover {
        box-shadow: ${({ theme }) => theme.boxShadowElevation3};
        cursor: pointer;

        ${ArrowIcon} {
            opacity: 1;
        }
    }

    background-color: ${({ theme }) => theme.backgroundSurfaceElevation1};
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.2s;
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

    const handleGoToCoinDetailClick = () => {
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

    return (
        <Card onClick={handleGoToCoinDetailClick}>
            <MarginContainer>
                <AssetContainer>
                    <AssetInfo
                        network={network}
                        assetsFiatBalances={assetsFiatBalances}
                        index={index}
                    />
                </AssetContainer>
                {!failed ? (
                    <>
                        <FiatAmount>
                            <FiatHeader
                                size="medium"
                                portfolioValue={cryptoValue}
                                localCurrency={symbol}
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
            </MarginContainer>
            {!isTestnet(symbol) && (
                <BuyMarginContainer>
                    <BuyContainer>
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
                    </BuyContainer>
                </BuyMarginContainer>
            )}
        </Card>
    );
};

export const AssetCardSkeleton = (props: { animate?: boolean }) => {
    const { shouldAnimate } = useLoadingSkeleton();
    const animate = props.animate ?? shouldAnimate;

    return (
        <Card>
            <MarginContainer>
                <AssetContainer>
                    <AssetInfoSkeleton animate={animate} />
                </AssetContainer>
                <FiatAmount>
                    <IntegerValue>
                        <SkeletonRectangle animate={animate} width={95} height={32} />
                    </IntegerValue>
                    {/* <DecimalValue withLeftMargin>
                        <SkeletonRectangle animate={animate} width={24} height={20} />
                    </DecimalValue> */}
                </FiatAmount>
                <CoinAmount>
                    <SkeletonRectangle animate={animate} width={50} height={16} />
                </CoinAmount>
            </MarginContainer>
            <BuyMarginContainer>
                <SkeletonRectangle animate={animate} width="100%" height={66} />
            </BuyMarginContainer>
        </Card>
    );
};
