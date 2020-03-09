import React from 'react';
import styled from 'styled-components';
import { Account } from '@wallet-types';
import { CoinLogo, variables } from '@trezor/components';
import { NoRatesTooltip, HiddenPlaceholder, Badge, FiatValue } from '@suite-components';
import LastWeekGraph from '../LastWeekGraph';
import { CoinBalance } from '@wallet-components';

const Wrapper = styled.div`
    padding: 12px 20px;
    display: grid;
    grid-gap: 10px;
    grid-template-columns: minmax(180px, 2fr) repeat(auto-fit, minmax(80px, 1fr));
`;

const AssetLogoWrapper = styled.div`
    padding-right: 6px;
    display: flex;
    align-items: center;
`;

const AssetName = styled.div`
    color: #808080;
    font-size: 12px;
    padding-top: 1px;
`;

// Similar Badge in DeviceItem (part of switch device modal)
// TOOD: refactor to single component
const SmallBadge = styled(Badge)`
    font-size: ${variables.FONT_SIZE.TINY};
`;

const BadgeText = styled.div`
    margin-right: 6px;
`;

const Col = styled.div`
    display: flex;
    align-items: center;
`;

const GraphWrapper = styled(Col)`
    min-height: 24px;
    flex: 1;
    width: 100%;
    height: 24px;
    /* margin-right: 20px; */
`;
const CryptoValueWrapper = styled(Col)`
    flex: 1;
    justify-content: flex-end;
    margin-right: 32px;
    text-align: right;
    white-space: nowrap;
`;
const FiatValueWrapper = styled(Col)``;

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    name: string;
    symbol: Account['symbol'];
    cryptoValue: string;
}

const Asset = React.memo(({ name, symbol, cryptoValue, ...rest }: Props) => {
    return (
        <Wrapper {...rest}>
            <Col>
                <AssetLogoWrapper>
                    <CoinLogo symbol={symbol} size={16} />
                </AssetLogoWrapper>
                <AssetName>
                    {name} ({symbol.toUpperCase()})
                </AssetName>
            </Col>
            <Col>
                <CryptoValueWrapper>
                    <CoinBalance value={cryptoValue} symbol={symbol} />
                </CryptoValueWrapper>
            </Col>
            <Col>
                <FiatValueWrapper>
                    <HiddenPlaceholder>
                        <FiatValue amount={cryptoValue} symbol={symbol}>
                            {fiatValue => <SmallBadge>{fiatValue}</SmallBadge>}
                        </FiatValue>
                    </HiddenPlaceholder>
                </FiatValueWrapper>
            </Col>
            <Col>
                <GraphWrapper>
                    <LastWeekGraph symbol={symbol} />
                </GraphWrapper>
            </Col>
            <Col>
                <FiatValue amount={cryptoValue} symbol={symbol}>
                    {(_fiatValue, exchangeRate) => {
                        return exchangeRate ? (
                            <SmallBadge>
                                1 {symbol.toUpperCase()} = {exchangeRate}
                            </SmallBadge>
                        ) : (
                            <SmallBadge>
                                <BadgeText>N/A</BadgeText> <NoRatesTooltip />
                            </SmallBadge>
                        );
                    }}
                </FiatValue>
            </Col>
        </Wrapper>
    );
});

export default Asset;
