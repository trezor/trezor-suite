import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Network } from 'src/types/wallet';

import {
    AmountUnitSwitchWrapper,
    CoinBalance,
    FiatValue,
    PriceTicker,
    SkeletonCircle,
    SkeletonRectangle,
    Translation,
    TrendTicker,
} from 'src/components/suite';
import { isTestnet } from '@suite-common/wallet-utils';
import { CoinmarketBuyButton } from 'src/views/dashboard/components/CoinmarketBuyButton';
import { borders, boxShadows, spacingsPx, typography } from '@trezor/theme';
import { selectAccountsByNetworkSymbol } from '@suite-common/wallet-core';
import { H2, CoinLogo, Icon, variables } from '@trezor/components';
import { useDispatch, useSelector } from 'react-redux';
import { useAccountSearch, useLoadingSkeleton } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';

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

const WalletContent = styled.div`
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
const ArrowIcon = styled(Icon)`
    visibility: hidden;
    margin-top: ${spacingsPx.xxxs};
`;

const WalletContainer = styled.div`
    margin-bottom: ${spacingsPx.xxxl};
    display: flex;
    &:hover {
        cursor: pointer;
        ${ArrowIcon} {
            visibility: visible;
        }
    }
`;

const CoinName = styled.div`
    ${typography.body};
`;
const Wallets = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    margin-top: ${spacingsPx.xxs};
`;
const WalletNumber = styled.div`
    color: ${({ theme }) => theme.textSubdued};
    font-variant-numeric: tabular-nums;
    ${typography.hint};
`;

const LogoWrapper = styled.div`
    padding-right: ${spacingsPx.sm};

    align-items: center;
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
    const { symbol, name } = network;
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

    const selectedAccounts = useSelector((state: any) =>
        selectAccountsByNetworkSymbol(state, symbol),
    );

    return (
        <>
            <Card>
                <MarginContainer>
                    <WalletContainer onClick={handleLogoClick}>
                        <LogoWrapper>
                            <CoinLogo symbol={symbol} size={24} />
                        </LogoWrapper>
                        <WalletContent>
                            <CoinName>{name}</CoinName>
                            <Wallets>
                                <Icon icon="WALLET" />
                                <WalletNumber>{selectedAccounts.length}</WalletNumber>
                            </Wallets>
                        </WalletContent>
                        <ArrowIcon
                            size={16}
                            icon="ARROW_RIGHT_LONG"
                            color={theme.iconPrimaryDefault}
                        />
                    </WalletContainer>
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
                                <BuyContainerLabel>Price</BuyContainerLabel>
                                <PriceTicker symbol={symbol} />
                            </div>
                            <div>
                                <BuyContainerLabel>Last week</BuyContainerLabel>
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
                <WalletContainer>
                    <LogoWrapper>
                        <SkeletonCircle size={44} />
                    </LogoWrapper>
                    <div>
                        <CoinName>
                            {' '}
                            <SkeletonRectangle animate={animate} width={100} />
                        </CoinName>
                        <Wallets>
                            <WalletNumber>
                                {' '}
                                <SkeletonRectangle animate={animate} width={60} />
                            </WalletNumber>
                        </Wallets>
                    </div>
                </WalletContainer>
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
