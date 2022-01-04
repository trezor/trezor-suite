import React from 'react';
import { transparentize } from 'polished';
import styled, { css } from 'styled-components';
import { variables, CoinLogo, Icon, useTheme } from '@trezor/components';
import { Translation } from '@suite-components';
import type { ExtendedMessageDescriptor } from '@suite-types';
import type { Network } from '@wallet-types';

const SettingsWrapper = styled.div`
    display: flex;
    align-self: stretch;
    align-items: center;
    border-radius: 100%;
    margin-right: -30px;
    padding: 0 10px;
    overflow: hidden;
    transition: 0.3s ease;
    position: relative;
    opacity: 0;
    &:hover {
        background-color: ${props =>
            transparentize(
                props.theme.HOVER_TRANSPARENTIZE_FILTER,
                props.theme.HOVER_PRIMER_COLOR,
            )};
    }
`;

const ImageWrapper = styled.div`
    display: flex;
    justify-items: flex-start;
    margin-right: 12px;
    margin-left: 12px;
    position: relative;
    transition: 0.3s ease;
    opacity: 1;
`;

const CoinWrapper = styled.button<{ toggled: boolean; disabled: boolean; hasSettings: boolean }>`
    display: flex;
    justify-items: flex-start;
    align-items: center;
    border: 1.5px solid ${props => props.theme.STROKE_GREY};
    background: ${props => props.theme.BG_WHITE};
    border-radius: 9999px;
    margin: 0 13px 18px 0;
    height: 47px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_DARK_GREY};
    cursor: pointer;
    transition: 0.3s ease;
    overflow: hidden;

    ${props =>
        !props.disabled &&
        props.hasSettings &&
        css`
            &:hover ${SettingsWrapper} {
                margin-right: 0;
                opacity: 1;
            }

            &:hover ${ImageWrapper} {
                margin-left: -18px;
                opacity: 0;
            }
        `}

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
        background: ${props => props.theme.BG_GREY};
    }
    ${props =>
        props.toggled &&
        !props.disabled &&
        css`
            border-color: ${props.theme.BG_GREEN};
        `}
`;

const Name = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    margin-top: 1px;
`;

const NameWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-right: 10px;
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
    ${props => props.visible && `opacity: 1;`}
`;

interface CoinProps {
    symbol: Network['symbol'];
    name: Network['name'];
    label?: ExtendedMessageDescriptor['id'];
    toggled: boolean;
    disabled?: boolean;
    onToggle?: () => void;
    onSettings?: () => void;
}

const Coin = ({
    symbol,
    name,
    label,
    toggled = false,
    disabled = false,
    onToggle,
    onSettings,
}: CoinProps) => {
    const theme = useTheme();

    return (
        <CoinWrapper
            toggled={toggled}
            disabled={disabled}
            hasSettings={!!onSettings}
            onClick={onToggle}
            data-test={`@settings/wallet/network/${symbol}`}
            data-active={toggled}
        >
            <ImageWrapper>
                <CoinLogo size={24} symbol={symbol} />
                <Check visible={toggled}>
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
            <SettingsWrapper
                onClick={e => {
                    e.stopPropagation();
                    if (disabled) return;
                    onSettings?.();
                }}
                data-test={`@settings/wallet/network/${symbol}/advance`}
            >
                <Icon icon="SETTINGS" />
            </SettingsWrapper>
        </CoinWrapper>
    );
};

export default Coin;
