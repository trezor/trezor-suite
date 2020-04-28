import React from 'react';
import styled from 'styled-components';
import { Network } from '@wallet-types';
import { CoinLogo, Icon, variables, colors } from '@trezor/components';
import {
    NoRatesTooltip,
    HiddenPlaceholder,
    Badge,
    FiatValue,
    Translation,
} from '@suite-components';
import LastWeekGraph from '../LastWeekGraph';
import { CoinBalance } from '@wallet-components';
import { useFiatValue } from '@wallet-hooks';

const Wrapper = styled.div`
    padding: 12px 0px;
    display: grid;
    grid-gap: 10px;
    grid-template-columns: minmax(180px, 2fr) repeat(auto-fit, minmax(80px, 1fr));
    border-top: 2px solid ${colors.BLACK96};
    &:first-of-type {
        border: 0px;
    }
`;

const LogoWrapper = styled.div`
    padding-right: 6px;
    display: flex;
    align-items: center;
`;

const Coin = styled.div`
    display: flex;
`;

const Symbol = styled.div`
    color: ${colors.BLACK50};
    display: flex;
    align-items: center;
    padding-top: 2px;
    font-size: ${variables.FONT_SIZE.TINY};
    text-indent: 6px;
`;

const Col = styled.div`
    display: flex;
    align-items: center;
`;

const FailedCol = styled(Col)`
    grid-column: 3 / 5;
    justify-content: flex-end;
    color: ${colors.RED};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const GraphWrapper = styled(Col)`
    min-height: 24px;
    flex: 1;
    width: 100%;
    height: 24px;
`;

const CryptoValueWrapper = styled(Col)`
    flex: 1;
    justify-content: flex-end;
    margin-right: 32px;
    text-align: right;
    white-space: nowrap;
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const FiatValueWrapper = styled(Col)``;

const FiatRateWrapper = styled(Col)`
    justify-content: flex-end;
`;

interface Props {
    network: Network;
    failed: boolean;
    cryptoValue: string;
}

const Asset = React.memo(({ network, failed, cryptoValue }: Props) => {
    const { symbol, name, testnet } = network;
    const { fiat, localCurrency } = useFiatValue();

    // get graph data only for mainnet and not failed accounts
    const lastWeekData =
        !testnet && !failed ? fiat.find(r => r.symbol === symbol)?.lastWeek?.tickers : [];

    // display one of view:
    // - failed
    // - testnet
    // - mainnet

    return (
        <Wrapper>
            <Col>
                <LogoWrapper>
                    <CoinLogo symbol={symbol} size={16} />
                </LogoWrapper>
                <Coin>{name}</Coin>
                <Symbol>{symbol.toUpperCase()}</Symbol>
            </Col>
            {failed && (
                <FailedCol>
                    <Translation id="TR_DASHBOARD_ASSET_FAILED" />
                    <Icon
                        style={{ paddingLeft: '4px', paddingBottom: '2px' }}
                        icon="WARNING"
                        color={colors.RED}
                        size={14}
                    />
                </FailedCol>
            )}
            {!failed && (
                <>
                    <CryptoValueWrapper>
                        <CoinBalance value={cryptoValue} symbol={symbol} />
                    </CryptoValueWrapper>
                    <FiatValueWrapper>
                        <HiddenPlaceholder>
                            <FiatValue amount={cryptoValue} symbol={symbol}>
                                {({ value }) => (value ? <Badge isSmall>{value}</Badge> : null)}
                            </FiatValue>
                        </HiddenPlaceholder>
                    </FiatValueWrapper>
                    <GraphWrapper>
                        <LastWeekGraph
                            lastWeekData={lastWeekData}
                            symbol={symbol}
                            localCurrency={localCurrency}
                        />
                    </GraphWrapper>
                    <FiatRateWrapper>
                        <FiatValue amount={cryptoValue} symbol={symbol}>
                            {({ rate }) =>
                                rate ? (
                                    <Badge isSmall isGray>
                                        1 {symbol.toUpperCase()} = {rate}
                                    </Badge>
                                ) : (
                                    <NoRatesTooltip />
                                )
                            }
                        </FiatValue>
                    </FiatRateWrapper>
                </>
            )}
        </Wrapper>
    );
});

export default Asset;
