import { type DefaultTheme, type RuleSet, css } from 'styled-components';

import { spacings } from '@trezor/theme';

import { type CardType, type PaddingType } from './types';
import { type Padding } from '../../utils/frameProps';

type PaddingMapArgs = {
    paddingType: PaddingType;
    hasHeading?: boolean;
};

type CardTypeMapArgs = {
    $type: CardType;
    $isClickable: boolean;
    $isSelected: boolean;
    theme: DefaultTheme;
};

export const mapPaddingTypeToPadding = ({ paddingType }: PaddingMapArgs): Padding | undefined => {
    const paddingMap: Record<PaddingType, Padding | undefined> = {
        none: undefined,
        tiny: { vertical: spacings.xs, horizontal: spacings.sm },
        small: { vertical: spacings.sm, horizontal: spacings.md },
        normal: { vertical: spacings.md, horizontal: spacings.lg },
        large: { vertical: spacings.lg, horizontal: spacings.xl },
    };

    return paddingMap[paddingType];
};

export const mapPaddingTypeToLabelPadding = ({ paddingType }: PaddingMapArgs): Padding => {
    const paddingMap: Record<PaddingType, Padding> = {
        none: { vertical: spacings.xxs },
        tiny: { vertical: spacings.xxs, horizontal: spacings.xxs },
        small: { vertical: spacings.xxs, horizontal: spacings.sm },
        normal: { vertical: spacings.xs, horizontal: spacings.lg },
        large: { vertical: spacings.sm, horizontal: spacings.xl },
    };

    return paddingMap[paddingType];
};

export const mapCardTypeToCSS = ({
    $type,
    $isClickable,
    $isSelected,
    theme,
}: CardTypeMapArgs): RuleSet<object> => {
    const cssMap: Record<CardType, RuleSet<object>> = {
        raised: css`
            background: ${theme.surfaceFillRaised};
            outline: 1px solid ${theme.surfaceBorderRaised};

            ${$isClickable &&
            css`
                background: ${theme.surfaceFillAction};
                outline-color: ${theme.surfaceBorderAction};

                ${$isSelected &&
                css`
                    outline: 2px solid ${theme.borderBrand};
                `}

                box-shadow: ${theme.surfaceShadowAction};

                &:hover {
                    box-shadow: ${theme.surfaceShadowActionHovered};
                }
            `}
        `,
        sunken: css`
            background: ${theme.surfaceFillSunken};
            outline: 1px solid ${theme.surfaceBorderSunken};
        `,
        flat: css`
            background: transparent;
            outline: 1px solid ${theme.borderNeutral};
        `,
        contrast: css`
            background: ${theme.elementFillNeutralSofter};
            outline: 1px solid ${theme.elementBorderNeutralSofterAlt};
        `,
    };

    return cssMap[$type];
};
