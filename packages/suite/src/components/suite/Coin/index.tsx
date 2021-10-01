import React from 'react';
import styled, { css } from 'styled-components';
import { variables, CoinLogo, Icon, useTheme } from '@trezor/components';
import { Translation } from '@suite-components';
import { ExtendedMessageDescriptor } from '@suite-types';
import { Network } from '@wallet-types';

const CoinWrapper = styled.button<{ selected: boolean; disabled: boolean }>`
    display: flex;
    justify-items: flex-start;
    align-items: center;
    padding: 0 15px;
    border: 1.5px solid ${props => props.theme.STROKE_GREY};
    background: ${props => props.theme.BG_WHITE};
    border-radius: 9999px;
    margin: 0 13px 18px 0;
    height: 47px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_DARK_GREY};
    cursor: pointer;
    transition: 0.3s ease;

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
        background: ${props => props.theme.BG_GREY};
    }
    ${props =>
        props.selected &&
        !props.disabled &&
        css`
            border-color: ${props.theme.BG_GREEN};
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

const NameWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

const NameLabeled = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    line-height: 0.86;
    margin-bottom: 3px;
`;

const Label = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 0.75;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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
    top: -2px;
    right: -2px;
    opacity: 0;
    transition: opacity 0.3s ease;
    ${props => props.visible && `opacity: 1`}
`;

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
    symbol: Network['symbol'];
    name: Network['name'];
    label?: ExtendedMessageDescriptor['id'];
    selected: boolean;
    disabled?: boolean;
}

const Coin = ({ symbol, name, label, selected = false, disabled = false, ...props }: Props) => {
    const theme = useTheme();
    return (
        <CoinWrapper selected={selected} disabled={disabled} {...props}>
            <ImageWrapper>
                <CoinLogo size={24} symbol={symbol} />
                <Check visible={selected}>
                    <Icon size={8} color={theme.TYPE_WHITE} icon="CHECK" />
                </Check>
            </ImageWrapper>
            {label ? (
                <NameWrapper>
                    <NameLabeled>{name}</NameLabeled>
                    <Label>
                        <Translation id={label} />
                    </Label>
                </NameWrapper>
            ) : (
                <Name>{name}</Name>
            )}
        </CoinWrapper>
    );
};

export default Coin;
