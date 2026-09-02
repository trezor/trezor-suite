import { type DefaultTheme, type RuleSet, css } from 'styled-components';

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
        tiny: { vertical: 8, horizontal: 12 },
        small: { vertical: 12, horizontal: 16 },
        normal: { vertical: 16, horizontal: 20 },
        large: { vertical: 20, horizontal: 24 },
    };

    return paddingMap[paddingType];
};

export const mapPaddingTypeToLabelPadding = ({ paddingType }: PaddingMapArgs): Padding => {
    const paddingMap: Record<PaddingType, Padding> = {
        none: { vertical: 4 },
        tiny: { vertical: 4, horizontal: 4 },
        small: { vertical: 4, horizontal: 12 },
        normal: { vertical: 8, horizontal: 20 },
        large: { vertical: 12, horizontal: 24 },
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

            ${
                $isClickable &&
                css`
                    background: ${theme.surfaceFillAction};
                    outline-color: ${theme.surfaceBorderAction};

                    ${
                        $isSelected &&
                        css`
                            outline: 2px solid ${theme.borderBrand};
                        `
                    }

                    box-shadow: ${theme.surfaceShadowAction};

                    &:hover {
                        box-shadow: ${theme.surfaceShadowActionHovered};
                    }
                `
            }
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
            outline-offset: -1px;

            ${
                $isClickable &&
                css`
                    ${
                        $isSelected &&
                        css`
                            outline: 2px solid ${theme.borderBrand};
                        `
                    }

                    box-shadow: ${theme.surfaceShadowAction};

                    &:hover {
                        box-shadow: ${theme.surfaceShadowActionHovered};
                    }
                `
            }
        `,
    };

    return cssMap[$type];
};
