import { UIVariant } from '@trezor/components/src/config/types';
import { CSSColor, Color } from '@trezor/theme';
import styled, { DefaultTheme } from 'styled-components';

type StatusLightVariant = Extract<UIVariant, 'primary' | 'warning' | 'destructive'>;

type MapArgs = {
    variant: StatusLightVariant;
    theme: DefaultTheme;
};

const mapVariantToBackgroundColor = ({ variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<StatusLightVariant, Color> = {
        primary: 'backgroundPrimarySubtleOnElevation0',
        warning: 'backgroundAlertRedSubtleOnElevation0',
        destructive: 'backgroundAlertRedSubtleOnElevation0',
    };

    return theme[colorMap[variant]];
};

const getInnerBackgroundColor = ({ variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<StatusLightVariant, Color> = {
        primary: 'backgroundPrimaryDefault',
        warning: 'backgroundAlertYellowBold',
        destructive: 'backgroundAlertRedBold',
    };

    return theme[colorMap[variant]];
};

const Circle = styled.div<{ variant: StatusLightVariant }>`
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
    <Circle variant={variant} className={className}>
        <div />
    </Circle>
);
