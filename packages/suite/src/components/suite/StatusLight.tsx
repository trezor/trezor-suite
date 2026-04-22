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
        primary: 'legacyBackgroundPrimarySubtleOnElevation0',
        warning: 'legacyBackgroundAlertRedSubtleOnElevation0',
        destructive: 'legacyBackgroundAlertRedSubtleOnElevation0',
        info: 'legacyBackgroundAlertBlueSubtleOnElevation0',
    };

    return theme[colorMap[$variant]];
};

const getInnerBackgroundColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<StatusLightVariant, Color> = {
        primary: 'legacyBackgroundPrimaryDefault',
        warning: 'legacyBackgroundAlertYellowBold',
        destructive: 'legacyBackgroundAlertRedBold',
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
