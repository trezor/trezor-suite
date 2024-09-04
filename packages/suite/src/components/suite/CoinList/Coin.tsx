import { MouseEvent } from 'react';
import { transparentize } from 'polished';
import styled, { css, useTheme } from 'styled-components';
import { variables, CoinLogo, Icon } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { typography } from '@trezor/theme';
import { TranslationKey } from '@suite-common/intl-types';

const SettingsWrapper = styled.div<{
    $toggled: boolean;
    onClick: ((e: MouseEvent) => void) | undefined;
}>`
    display: flex;
    align-self: stretch;
    align-items: center;
    border-radius: 100%;
    margin-right: -30px;
    padding: 0 10px;
    overflow: hidden;
    transition: 0.2s ease-in-out;
    position: relative;
    opacity: 0;
    ${({ onClick, theme }) =>
        onClick &&
        css`
            &:hover {
                background-color: ${transparentize(
                    theme.legacy.HOVER_TRANSPARENTIZE_FILTER,
                    theme.legacy.HOVER_PRIMER_COLOR,
                )};
            }
        `}

    ${props =>
        !props.$toggled &&
        css`
            pointer-events: none;
        `}

    @media (hover: none) {
        pointer-events: none;
    }
`;

const ImageWrapper = styled.div`
    display: flex;
    justify-items: flex-start;
    margin-right: 12px;
    margin-left: 12px;
    position: relative;
    transition: 0.2s ease-in-out;
    opacity: 1;
`;

const ShiftToSettings = css`
    ${SettingsWrapper} {
        margin-right: 0;
        opacity: 1;
    }
    ${ImageWrapper} {
        margin-left: -18px;
        opacity: 0;
    }
`;

export const CoinWrapper = styled.button<{
    $toggled: boolean;
    disabled: boolean; // intentionally not transient, button has disabled HTML Attribute
    $forceHover: boolean;
    $hasSettings: boolean;
}>`
    display: flex;
    place-items: center flex-start;
    border: 1.5px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    background: ${({ theme }) => theme.legacy.BG_WHITE};
    border-radius: 9999px;
    height: 47px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    cursor: pointer;
    transition: 0.2s ease-in-out;
    overflow: hidden;

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
        background: ${({ theme }) => theme.legacy.BG_GREY};
    }

    &:hover {
        background: ${({ theme }) => theme.legacy.BG_GREY_ALT};
        border-color: ${({ theme, $toggled }) =>
            $toggled ? theme.legacy.BG_GREEN_HOVER : theme.legacy.TYPE_LIGHTER_GREY};
    }

    ${({ disabled, $forceHover, $hasSettings, theme, $toggled }) =>
        !disabled &&
        $toggled &&
        css`
            border-color: ${theme.backgroundPrimaryDefault};
            ${$forceHover && ShiftToSettings}
            ${$hasSettings &&
            css`
                @media (hover: hover) {
                    &:hover {
                        ${ShiftToSettings}
                    }
                }
            `}
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
    ${typography.label}

    color: ${({ theme }) => theme.textSubdued};
`;

const Check = styled.div<{ $visible: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: ${({ theme }) => theme.backgroundPrimaryDefault};
    width: 12px;
    height: 12px;
    position: absolute;
    top: -2px;
    right: -2px;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    ${props => props.$visible && `opacity: 1;`}
`;

interface CoinProps {
    symbol: NetworkSymbol;
    name: string;
    label?: TranslationKey;
    toggled: boolean;
    disabled?: boolean;
    forceHover?: boolean;
    onToggle?: () => void;
    onSettings?: () => void;
}

export const Coin = ({
    symbol,
    name,
    label,
    toggled,
    disabled = false,
    forceHover = false,
    onToggle,
    onSettings,
}: CoinProps) => {
    const theme = useTheme();

    const onSettingsClick =
        onSettings &&
        ((e: MouseEvent) => {
            e.stopPropagation();
            onSettings();
        });

    return (
        <CoinWrapper
            $toggled={toggled}
            disabled={disabled}
            $forceHover={forceHover}
            $hasSettings={!!onSettings}
            onClick={onToggle}
            data-testid={`@settings/wallet/network/${symbol}`}
            data-active={toggled}
        >
            <ImageWrapper>
                <CoinLogo size={24} symbol={symbol} />
                <Check $visible={toggled}>
                    <Icon size={8} color={theme.legacy.TYPE_WHITE} name="check" />
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
                onClick={onSettingsClick}
                $toggled={toggled}
                data-testid={`@settings/wallet/network/${symbol}/advance`}
            >
                <Icon name="settings" />
            </SettingsWrapper>
        </CoinWrapper>
    );
};
