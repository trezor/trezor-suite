import { DefaultTheme } from 'styled-components';

export type RenderLinearGradientProps = {
    theme: DefaultTheme;
};

export const renderLinearGradient = ({ theme }: RenderLinearGradientProps) => {
    return (
        <defs>
            <linearGradient
                id="gradient-area"
                x1="0"
                y1="0"
                x2="0"
                y2="300"
                gradientUnits="userSpaceOnUse"
            >
                <stop offset="0" stopColor={theme.backgroundSecondaryDefault} stopOpacity="0.2" />
                <stop offset="1" stopColor={theme.backgroundSecondaryDefault} stopOpacity="0" />
            </linearGradient>
        </defs>
    );
};
