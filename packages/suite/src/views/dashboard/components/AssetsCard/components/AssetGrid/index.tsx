import React from 'react';
import styled from 'styled-components';
import { Network } from '@wallet-types';
import { CoinLogo, Icon, variables, useTheme } from '@trezor/components';
import {
    FiatValue,
    SkeletonCircle,
    SkeletonRectangle,
    Ticker,
    Translation,
} from '@suite-components';
import { CoinBalance } from '@wallet-components';
import { isTestnet } from '@wallet-utils/accountUtils';
import * as routerActions from '@suite-actions/routerActions';
import { useActions, useAccountSearch, useLoadingSkeleton } from '@suite-hooks';

const Col = styled.div`
    display: flex;
    align-items: center;
    padding: 16px 0px;
    color: ${props => props.theme.TYPE_DARK_GREY};
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
    padding: 0px 15px 15px 15px;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
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
    background-color: ${props => props.theme.BG_WHITE};
`;

const CryptoBalanceWrapper = styled(Col)`
    display: flex;
    align-items: center;
    justify-content: center;
`;

const FailedCol = styled(Col)`
    color: ${props => props.theme.TYPE_RED};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-column: 1 / 3;
        margin-left: 20px;
        border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
    }
`;

const FiatBalanceWrapper = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-left: 0.5ch;
`;

interface Props {
    network: Network;
    failed: boolean;
    cryptoValue: string;
}

const AssetGrid = React.memo(({ network, failed, cryptoValue }: Props) => {
    const { symbol, name } = network;
    const theme = useTheme();
    const { setCoinFilter, setSearchString } = useAccountSearch();

    const { goto } = useActions({ goto: routerActions.goto });
    return (
        <CoinGridWrapper>
            <UpperRowWrapper>
                <CoinNameWrapper
                    onClick={() => {
                        goto('wallet-index', {
                            params: {
                                symbol,
                                accountIndex: 0,
                                accountType: 'normal',
                            },
                        });
                        // activate coin filter and reset account search string
                        setCoinFilter(symbol);
                        setSearchString(undefined);
                    }}
                >
                    <LogoWrapper>
                        <CoinLogo symbol={symbol} size={24} />
                    </LogoWrapper>
                    <Coin>{name}</Coin>
                </CoinNameWrapper>
                {!isTestnet(symbol) && <Ticker symbol={symbol} />}
            </UpperRowWrapper>
            {!failed ? (
                <CryptoBalanceWrapper>
                    <CoinBalance value={cryptoValue} symbol={symbol} />
                    <FiatBalanceWrapper>
                        <FiatValue
                            amount={cryptoValue}
                            symbol={symbol}
                            showApproximationIndicator
                        />
                    </FiatBalanceWrapper>
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
            </UpperRowWrapper>
            <CryptoBalanceWrapper>
                <SkeletonRectangle animate={animate} width="160px" />
            </CryptoBalanceWrapper>
        </CoinGridWrapper>
    );
};

export default AssetGrid;
