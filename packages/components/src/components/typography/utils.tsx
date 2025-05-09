import { css } from 'styled-components';

import { TypographyStyle, typography, typographyStyles } from '@trezor/theme';

import { UIAlignment, uiAlignments } from '../../config/types';
import { TransientProps, makePropsTransient } from '../../utils/transientProps';

export const textWraps = ['balance', 'break-word', 'pretty', 'nowrap'];
export type TextWrap = (typeof textWraps)[number];

export const textCase = ['uppercase', 'lowercase', 'titlecase', 'capitalize'] as const;
export type TextCase = (typeof textCase)[number];

export const wordBreaks = ['normal', 'break-all', 'keep-all', 'inherit', 'unset'] as const;
export type WordBreak = (typeof wordBreaks)[number];

export type TextProps = {
    typographyStyle?: TypographyStyle;
    textWrap?: TextWrap;
    align?: UIAlignment;
    ellipsisLineCount?: number;
    case?: TextCase;
    wordBreak?: WordBreak;
};

export type TextPropsKeys = keyof TextProps;

type TransientTextProps = TransientProps<TextProps>;

export const pickAndPrepareTextProps = (
    props: Record<string, any>,
    allowedTextProps: Array<TextPropsKeys>,
) =>
    makePropsTransient(
        allowedTextProps.reduce((acc, item) => ({ ...acc, [item]: props[item] }), {}),
    );

export const withTextProps = ({
    $textWrap,
    $typographyStyle,
    $align,
    $ellipsisLineCount = 0,
    $case,
    $wordBreak,
}: TransientTextProps) => css`
    ${$textWrap &&
    css`
        text-wrap: ${$textWrap};
    `}
    ${$wordBreak &&
    css`
        word-break: ${$wordBreak};
    `}
    ${$typographyStyle
        ? css`
              ${typography[$typographyStyle]}
          `
        : ''}
    ${$align &&
    css`
        text-align: ${$align};
    `}
    ${$ellipsisLineCount > 0 &&
    css`
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    `}
    ${$ellipsisLineCount > 1 &&
    css`
        white-space: initial;
        -webkit-line-clamp: ${$ellipsisLineCount};
        display: -webkit-box;
        -webkit-box-orient: vertical;
    `}
    ${$case && $case === 'titlecase'
        ? css`
              text-transform: lowercase;

              &::first-letter {
                  text-transform: uppercase;
              }
          `
        : css`
              text-transform: ${$case};
          `}
`;

const getStorybookType = (key: TextPropsKeys) => {
    switch (key) {
        case 'wordBreak':
            return {
                control: {
                    type: 'select',
                    options: wordBreaks,
                },
            };
        case 'textWrap':
            return {
                options: [undefined, ...textWraps],
                control: {
                    type: 'select',
                },
            };
        case 'typographyStyle':
            return {
                options: [undefined, ...typographyStyles],
                control: {
                    type: 'select',
                },
            };
        case 'align':
            return {
                options: [undefined, ...uiAlignments],
                control: {
                    type: 'select',
                },
            };
        case 'ellipsisLineCount':
            return {
                control: {
                    type: 'number',
                    min: 0,
                },
            };
        case 'case':
            return {
                options: [undefined, ...textCase],
                control: {
                    type: 'select',
                },
            };
        default:
            return {
                control: {
                    type: 'text',
                },
            };
    }
};

export const getTextPropsStory = (allowedTextProps: Array<TextPropsKeys>) => {
    const argTypes = allowedTextProps.reduce(
        (acc, key) => ({
            ...acc,
            [key]: {
                table: {
                    category: 'Text props',
                },
                ...getStorybookType(key),
            },
        }),
        {},
    );

    return {
        args: {
            ...(allowedTextProps.includes('textWrap') ? { textWrap: undefined } : {}),
            ...(allowedTextProps.includes('wordBreak') ? { wordBreak: undefined } : {}),
            ...(allowedTextProps.includes('typographyStyle') ? { typographyStyle: undefined } : {}),
            ...(allowedTextProps.includes('align') ? { align: undefined } : {}),
            ...(allowedTextProps.includes('ellipsisLineCount')
                ? { ellipsisLineCount: undefined }
                : {}),
            ...(allowedTextProps.includes('case') ? { case: undefined } : {}),
        },
        argTypes,
    };
};
