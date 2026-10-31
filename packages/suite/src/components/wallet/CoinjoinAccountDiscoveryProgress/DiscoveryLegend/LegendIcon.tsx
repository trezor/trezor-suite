import { useTheme } from 'styled-components';

import { typographyStylesBase } from '@trezor/theme';

import { getIllustrationColors } from '../PrivacyIllustration/getIllustrationColors';
import { type LegendIconType } from '../discoveryCopy';

const ICON_SIZE = 14;
const STROKE_WIDTH = 1.25;
// As tall as a line of the legend text, so the icon centres on the first line.
const BOX_HEIGHT = typographyStylesBase['body-sm'].lineHeight;

type LegendIconProps = {
    type: LegendIconType;
};

// A colour key to the still illustration, so it uses the illustration's colours.
export const LegendIcon = ({ type }: LegendIconProps) => {
    const theme = useTheme();
    const colors = getIllustrationColors(theme);

    return (
        <svg
            width={ICON_SIZE}
            height={BOX_HEIGHT}
            viewBox={`0 ${(ICON_SIZE - BOX_HEIGHT) / 2} ${ICON_SIZE} ${BOX_HEIGHT}`}
            aria-hidden="true"
            focusable="false"
        >
            {type === 'local' && (
                <g
                    fill="none"
                    stroke={theme.contentSecondary}
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x={2.4} y={3} width={9.2} height={6.4} rx={1.4} />
                    <path d="M1.2 11.4h11.6" />
                </g>
            )}
            {type === 'discard' && (
                <>
                    <rect
                        x={2}
                        y={4.2}
                        width={5.6}
                        height={5.6}
                        rx={1.3}
                        fill={colors.ember}
                        opacity={0.85}
                    />
                    <rect
                        x={9.3}
                        y={5.9}
                        width={2.8}
                        height={2.8}
                        rx={0.8}
                        fill={colors.ink}
                        fillOpacity={colors.ashAlpha}
                    />
                </>
            )}
            {type === 'circuit' && (
                <>
                    <path
                        d="M1.4 10.2 C4.2 10.2 4.8 4.4 8 4.4 S11 6.4 12.8 6.2"
                        fill="none"
                        stroke={colors.violet}
                        strokeWidth={STROKE_WIDTH}
                        strokeLinecap="round"
                    />
                    <circle cx={8} cy={4.4} r={1.6} fill={colors.violet} />
                </>
            )}
            {type === 'keep' && <circle cx={7} cy={7} r={2.8} fill={colors.keep} />}
            {type === 'keepUnconfirmed' && (
                <circle
                    cx={7}
                    cy={7}
                    r={2.4}
                    fill="none"
                    stroke={colors.keep}
                    strokeWidth={STROKE_WIDTH}
                />
            )}
        </svg>
    );
};
