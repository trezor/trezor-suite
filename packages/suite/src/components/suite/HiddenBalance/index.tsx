import React from 'react';
import { useHover } from '@suite-utils/dom';
import styled from 'styled-components';
import { Account } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
`;

const Dot = styled.div`
    font-weight: bold;
`;

const Symbol = styled.div`
    padding-left: 1ch;
`;

interface Props {
    stringToHide: string;
    symbol: Account['symbol'];
    discreetMode: boolean;
}

export default ({ stringToHide, symbol, discreetMode }: Props) => {
    const [hoverRef, isHovered] = useHover();
    const stringLength = stringToHide.length;
    const uppercaseSymbol = symbol.toUpperCase();

    if (!discreetMode)
        return (
            <Wrapper>
                {stringToHide} {uppercaseSymbol}
            </Wrapper>
        );

    return (
        // @ts-ignore
        <Wrapper ref={hoverRef}>
            {isHovered && stringToHide}
            {!isHovered && [...Array(stringLength)].map(() => <Dot>•</Dot>)}
            <Symbol>{uppercaseSymbol}</Symbol>
        </Wrapper>
    );
};
