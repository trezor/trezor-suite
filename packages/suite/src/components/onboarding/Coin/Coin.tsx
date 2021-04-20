import React from 'react';
import styled from 'styled-components';
import { variables, CoinLogo, Icon } from '@trezor/components';
import { useTheme } from '@suite-hooks';
import { Network } from '@wallet-types';

const CoinWrapper = styled.button<{ selected: boolean; disabled: boolean }>`
    &,
    &:disabled {
        display: flex;
        justify-items: flex-start;
        align-items: center;
        padding: 0 15px;
        border: 1.5px solid ${props => props.theme.BG_GREY};
        background: ${props => props.theme.BG_GREY};
        border-radius: 9999px;
        margin: 0 13px 18px 0;
        height: 47px;
        font-weight: ${variables.FONT_WEIGHT.MEDIUM};
        color: ${props => props.theme.TYPE_DARK_GREY};
        cursor: pointer;
        transition: 0.3s ease;
    }
    ${props =>
        props.disabled &&
        `
        &,
        &:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }
    `}
    ${props =>
        props.selected &&
        !props.disabled &&
        `
        & {
            border-color: ${props.theme.TYPE_GREEN};
            background: ${props.theme.BG_WHITE};
        }
    `}
`;

const ImageWrapper = styled.div`
    display: flex;
    justify-items: flex-start;
    margin: 0 15px 0 0;
    position: relative;
`;

const Name = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    margin-top: 1px;
`;

const Check = styled.div<{ visible: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: ${props => props.theme.BG_GREEN};
    width: 12px;
    height: 12px;
    position: absolute;
    top: 0;
    right: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
    ${props => props.visible && `opacity: 1`}
`;

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
    symbol: Network['symbol'];
    name: Network['name'];
    selected: boolean;
    disabled?: boolean;
}

const Coin = ({ symbol, name, selected = false, disabled = false, ...props }: Props) => {
    const { theme } = useTheme();
    return (
        <CoinWrapper selected={selected} disabled={disabled} {...props}>
            <ImageWrapper>
                <CoinLogo size={24} symbol={symbol} />
                <Check visible={selected}>
                    <Icon size={8} color={theme.TYPE_WHITE} icon="CHECK" />
                </Check>
            </ImageWrapper>
            <Name>{name}</Name>
        </CoinWrapper>
    );
};

export default Coin;
export type { Props as CoinProps };
