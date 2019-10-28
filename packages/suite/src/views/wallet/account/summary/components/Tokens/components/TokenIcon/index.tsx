import React from 'react';
import styled from 'styled-components';
// @ts-ignore there are no types for this lib
import ColorHash from 'color-hash';
// @ts-ignore there are no types for this lib
import ScaleText from 'react-scale-text';

const Wrapper = styled.div<{ textColor: string; backgroundColor: string }>`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    margin-right: 10px;
    line-height: 30px;
    text-transform: uppercase;
    user-select: none;
    text-align: center;
    padding: 6px;
    color: ${props => props.textColor};
    border-color: ${props => props.backgroundColor};
    background: ${props => props.backgroundColor};
`;

const P = styled.p`
    line-height: 24px;
    padding: 0px;
    color: inherit;
`;

interface Props {
    symbol?: string;
    address: string;
}

const TokenIcon = ({ symbol, address }: Props) => {
    const bgColor = new ColorHash({ lightness: 0.9 });
    const textColor = new ColorHash({ lightness: 0.3, saturation: 1 });
    return (
        <Wrapper textColor={textColor.hex(address)} backgroundColor={bgColor.hex(address)}>
            {symbol && (
                <ScaleText widthOnly>
                    <P>{symbol}</P>
                </ScaleText>
            )}
        </Wrapper>
    );
};

export default TokenIcon;
