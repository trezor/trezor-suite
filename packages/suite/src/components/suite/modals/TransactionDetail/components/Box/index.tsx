import React from 'react';
import styled, { css } from 'styled-components';
import { Network } from '@suite/types/wallet';
import { CoinLogo } from '@trezor/components';

const COLOR_BORDER = '#ccc';

const StyledBox = styled.div<{ coinLogo?: Props['coinLogo'] }>`
    border-radius: 4px;
    border: solid 1px ${COLOR_BORDER};

    & + & {
        margin-top: 20px;
    }

    ${props =>
        props.coinLogo &&
        css`
            /* offset logo */
            margin-top: 24px;
        `}
`;

const LogoWrapper = styled.div`
    position: relative;
    display: flex;
    justify-content: center;
`;

const WhiteCircle = styled.div`
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: -24px;
    padding: 3px;
    background: white;
    border-radius: 50%;
`;

interface Props {
    children?: React.ReactNode;
    coinLogo?: Network['symbol'];
}

const Box = (props: Props) => {
    return (
        <StyledBox coinLogo={props.coinLogo}>
            {props.coinLogo && (
                <LogoWrapper>
                    <WhiteCircle>
                        <CoinLogo size={32} symbol={props.coinLogo} />
                    </WhiteCircle>
                </LogoWrapper>
            )}
            {props.children}
        </StyledBox>
    );
};

export default Box;
