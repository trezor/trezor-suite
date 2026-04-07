import { type MouseEvent } from 'react';

import styled, { css } from 'styled-components';

import { Translation, type TranslationKey } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Icon, Paragraph, useElevation } from '@trezor/components';
import { focusStyleTransition, getFocusShadowStyle } from '@trezor/components/src/utils/utils';
import { CoinLogo } from '@trezor/product-components';
import { type Elevation, mapElevationToBackground, mapElevationToBorder } from '@trezor/theme';

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
                background-color: ${theme.backgroundTertiaryPressedOnElevation1};
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
    $elevation: Elevation;
}>`
    display: flex;
    place-items: center flex-start;
    border: 1.5px solid ${mapElevationToBorder};
    background: ${mapElevationToBackground};
    border-radius: 9999px;
    height: 47px;
    font-weight: bold;
    color: ${({ theme }) => theme.textDefault};
    cursor: pointer;
    transition:
        0.2s ease-in-out,
        ${focusStyleTransition};
    overflow: hidden;

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
        background: ${({ theme }) => theme.backgroundNeutralBoldInverted};
    }

    ${getFocusShadowStyle()}

    &:hover {
        background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation0};
        border-color: ${({ theme, $toggled }) =>
            $toggled ? theme.backgroundPrimaryPressed : theme.borderInputFocus};
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

const NameWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-right: 10px;
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
    const { elevation } = useElevation();

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
            $elevation={elevation}
        >
            <ImageWrapper>
                <CoinLogo size={24} symbol={symbol} type="token" />
                <Check $visible={toggled}>
                    <Icon size={8} color="contentPrimaryInverse" name="check" />
                </Check>
            </ImageWrapper>
            {label ? (
                <NameWrapper>
                    <Paragraph typographyStyle="body-sm">{name}</Paragraph>
                    <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <Translation id={label} />
                    </Paragraph>
                </NameWrapper>
            ) : (
                <Paragraph typographyStyle="body-md" margin={{ top: 2 }}>
                    {name}
                </Paragraph>
            )}
            <SettingsWrapper
                onClick={onSettingsClick}
                $toggled={toggled}
                data-testid={`@settings/wallet/network/${symbol}/advance`}
            >
                <Icon name="gear" />
            </SettingsWrapper>
        </CoinWrapper>
    );
};
