import styled, { type DefaultTheme } from 'styled-components';

import { type UIVariant } from '@trezor/components/src/config/types';
import { type CSSColor, type Color } from '@trezor/theme';

type StatusLightVariant = Extract<UIVariant, 'primary' | 'warning' | 'destructive' | 'info'>;

type MapArgs = {
    $variant: StatusLightVariant;
    theme: DefaultTheme;
};

const mapVariantToBackgroundColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<StatusLightVariant, Color> = {
        primary: 'elementFillBrandSofter',
        warning: 'elementFillWarningSofter',
        destructive: 'elementFillCriticalSofter',
        info: 'elementFillInfoSofter',
    };

    return theme[colorMap[$variant]];
};

const getInnerBackgroundColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<StatusLightVariant, Color> = {
        primary: 'elementFillBrandBold',
        warning: 'elementFillWarningBold',
        destructive: 'elementFillCriticalBold',
        info: 'contentInfo',
    };

    return theme[colorMap[$variant]];
};

const Circle = styled.div<{ $variant: StatusLightVariant }>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${mapVariantToBackgroundColor};

    & > div {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: ${getInnerBackgroundColor};
    }
`;

interface StatusLightProps {
    variant: StatusLightVariant;
    className?: string;
}

export const StatusLight = ({ variant, className }: StatusLightProps) => (
    <Circle $variant={variant} className={className}>
        <div />
    </Circle>
);
