import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Network } from 'src/types/wallet';

import {
    AmountUnitSwitchWrapper,
    CoinBalance,
    FiatValue,
    PriceTicker,
    SkeletonRectangle,
    Translation,
    TrendTicker,
} from 'src/components/suite';
import { isTestnet } from '@suite-common/wallet-utils';
import { CoinmarketBuyButton } from 'src/views/dashboard/components/CoinmarketBuyButton';
import { borders, boxShadows, spacingsPx, typography } from '@trezor/theme';

import { H2, Icon, variables } from '@trezor/components';
import { useDispatch } from 'react-redux';
import { useAccountSearch, useLoadingSkeleton } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { AssetInfo, AssetInfoSkeleton } from './AssetInfo';

type AssetCardProps = {
    network: Network;
    failed: boolean;
    cryptoValue: string;
};

const BuyContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: ${spacingsPx.lg};
    padding-top: ${spacingsPx.sm};
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation2};
    border-radius: 8px; // @TODO, we miss this border size
    padding: ${spacingsPx.sm} ${spacingsPx.sm} ${spacingsPx.sm} ${spacingsPx.md};
`;

const BuyMarginContainer = styled.div`
    margin: ${spacingsPx.xs};
`;

const MarginContainer = styled.div`
    padding: ${spacingsPx.lg} ${spacingsPx.sm} ${spacingsPx.sm} ${spacingsPx.xl};
    flex: 1;
`;

const Card = styled.div`
    border-radius: ${borders.radii.md};
    box-shadow: ${boxShadows.elevation1};
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation1};
    display: flex;
    flex-direction: column;
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

const DecimalValue = styled.div<{ withLeftMargin?: boolean }>`
    ${typography.hint};
    font-variant-numeric: tabular-nums;
    align-self: flex-end;
    letter-spacing: 0.565px;
    margin-left: ${({ withLeftMargin }) => `${withLeftMargin ? '4px' : 0}`};
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

export const AssetCard = ({ network, failed, cryptoValue }: AssetCardProps) => {
    const { symbol } = network;
    const dispatch = useDispatch();
    const theme = useTheme();
    const { setCoinFilter, setSearchString } = useAccountSearch();

    const handleLogoClick = () => {
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
        <>
            <Card>
                <MarginContainer>
                    <AssetContainer>
                        <AssetInfo network={network} onClick={handleLogoClick} />
                    </AssetContainer>
                    {!failed ? (
                        <>
                            <FiatAmount>
                                <IntegerValue>
                                    <FiatValue amount={cryptoValue} symbol={symbol} />
                                </IntegerValue>
                                <DecimalValue>.92</DecimalValue>
                            </FiatAmount>
                            <CoinAmount>
                                <AmountUnitSwitchWrapper symbol={symbol}>
                                    <CoinBalance value={cryptoValue} symbol={symbol} />
                                </AmountUnitSwitchWrapper>
                            </CoinAmount>
                        </>
                    ) : (
                        <FailedContainer>
                            <Icon
                                style={{ paddingLeft: '4px', paddingBottom: '2px' }}
                                icon="WARNING"
                                color={theme.TYPE_RED}
                                size={14}
                            />
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
                                    <Translation id="TR_LAST_WEEK" />
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
        </>
    );
};

export const AssetCardSkeleton = (props: { animate?: boolean }) => {
    const { shouldAnimate } = useLoadingSkeleton();
    const animate = props.animate ?? shouldAnimate;

    return (
        <Card>
            <MarginContainer>
                <AssetInfoSkeleton animate={animate} />
                <FiatAmount>
                    <IntegerValue>
                        <SkeletonRectangle animate={animate} width={95} height={32} />
                    </IntegerValue>
                    <DecimalValue withLeftMargin>
                        <SkeletonRectangle animate={animate} width={24} height={20} />
                    </DecimalValue>
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
