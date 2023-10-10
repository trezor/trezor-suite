import { memo } from 'react';
import styled, { useTheme } from 'styled-components';
import { Network } from 'src/types/wallet';
import { CoinLogo, Icon, variables } from '@trezor/components';
import {
    AmountUnitSwitchWrapper,
    CoinBalance,
    FiatValue,
    SkeletonCircle,
    SkeletonRectangle,
    Ticker,
    Translation,
} from 'src/components/suite';
import { CoinmarketBuyButton } from 'src/views/dashboard/components/CoinmarketBuyButton';
import { isTestnet } from '@suite-common/wallet-utils';
import { goto } from 'src/actions/suite/routerActions';
import { useAccountSearch, useDispatch, useLoadingSkeleton } from 'src/hooks/suite';

const Col = styled.div`
    display: flex;
    align-items: center;
    padding: 16px 0;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const CoinNameWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    cursor: pointer;
`;

const UpperRowWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 15px 0;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

const Coin = styled.div`
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    align-items: center;
`;

const LogoWrapper = styled.div`
    padding-right: 12px;
    display: flex;
    align-items: center;
`;

const CoinGridWrapper = styled.div`
    min-width: 330px;
    min-height: 118px;
    padding: 18px 16px;
    border-radius: 8px;
    background-color: ${({ theme }) => theme.BG_WHITE};
`;

const CryptoBalanceWrapper = styled(Col)`
    display: flex;
    align-items: center;
    justify-content: center;
`;

const FailedCol = styled(Col)`
    color: ${({ theme }) => theme.TYPE_RED};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};

    ${variables.SCREEN_QUERY.MOBILE} {
        grid-column: 1 / 3;
        margin-left: 20px;
        border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    }
`;

const FiatBalanceWrapper = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin-left: 0.5ch;
`;

const TickerWrapper = styled.div`
    align-self: center;
`;

interface AssetGridProps {
    network: Network;
    failed: boolean;
    cryptoValue: string;
}

export const AssetGrid = memo(({ network, failed, cryptoValue }: AssetGridProps) => {
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

    return (
        <CoinGridWrapper>
            <UpperRowWrapper>
                <CoinNameWrapper onClick={handleLogoClick}>
                    <LogoWrapper>
                        <CoinLogo symbol={symbol} size={24} />
                    </LogoWrapper>

                    <Coin>{name}</Coin>
                </CoinNameWrapper>
                {!isTestnet(symbol) && (
                    <>
                        <TickerWrapper>
                            <Ticker symbol={symbol} />
                        </TickerWrapper>
                        <CoinmarketBuyButton
                            symbol={symbol}
                            dataTest={`@dashboard/assets/grid/${symbol}/buy-button`}
                        />
                    </>
                )}
            </UpperRowWrapper>

            {!failed ? (
                <CryptoBalanceWrapper>
                    <AmountUnitSwitchWrapper symbol={symbol}>
                        <CoinBalance value={cryptoValue} symbol={symbol} />

                        <FiatBalanceWrapper>
                            <FiatValue
                                amount={cryptoValue}
                                symbol={symbol}
                                showApproximationIndicator
                            />
                        </FiatBalanceWrapper>
                    </AmountUnitSwitchWrapper>
                </CryptoBalanceWrapper>
            ) : (
                <FailedCol>
                    <Translation id="TR_DASHBOARD_ASSET_FAILED" />
                    <Icon
                        style={{ paddingLeft: '4px', paddingBottom: '2px' }}
                        icon="WARNING"
                        color={theme.TYPE_RED}
                        size={14}
                    />
                </FailedCol>
            )}
        </CoinGridWrapper>
    );
});

export const AssetGridSkeleton = (props: { animate?: boolean }) => {
    const { shouldAnimate } = useLoadingSkeleton();
    const animate = props.animate ?? shouldAnimate;

    return (
        <CoinGridWrapper>
            <UpperRowWrapper>
                <CoinNameWrapper>
                    <LogoWrapper>
                        <SkeletonCircle />
                    </LogoWrapper>
                    <SkeletonRectangle animate={animate} />
                </CoinNameWrapper>

                <SkeletonRectangle animate={animate} />
                <SkeletonRectangle animate={animate} />
            </UpperRowWrapper>

            <CryptoBalanceWrapper>
                <SkeletonRectangle animate={animate} width="160px" />
            </CryptoBalanceWrapper>
        </CoinGridWrapper>
    );
};
