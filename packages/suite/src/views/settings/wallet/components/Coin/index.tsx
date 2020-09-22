import React from 'react';
import styled from 'styled-components';
import { variables, colors, CoinLogo } from '@trezor/components';
import { Network } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Name = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.BLACK0};
    margin: 0 8px;
    padding-top: 2px;
`;

const Symbol = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    padding-top: 2px;
`;

interface Props {
    name: string;
    symbol: Network['symbol'];
}

const Coin = ({ name, symbol }: Props) => (
    <Wrapper>
        <CoinLogo size={24} symbol={symbol} />
        <Name> {name}</Name>
        <Symbol> {symbol.toUpperCase()}</Symbol>
    </Wrapper>
);

export default Coin;
