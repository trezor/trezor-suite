import { typography, TypographyStyle, typographyStyles } from '@trezor/theme';
import { TransientProps } from '../../utils/transientProps';
import { UIHorizontalAlignment, uiHorizontalAlignments } from '../../config/types';
import { css } from 'styled-components';
import { makePropsTransient } from '../../utils/transientProps';

export const textWraps = ['balance', 'break-word'];
export type TextWrap = (typeof textWraps)[number];

export type TextProps = {
    typographyStyle?: TypographyStyle;
    textWrap?: TextWrap;
    align?: UIHorizontalAlignment;
    ellipsisLineCount?: number;
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
}: TransientTextProps) => {
    return css`
        ${$textWrap &&
        css`
            text-wrap: ${$textWrap};
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
    `;
};

const getStorybookType = (key: TextPropsKeys) => {
    switch (key) {
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
                options: [undefined, ...uiHorizontalAlignments],
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
            ...(allowedTextProps.includes('typographyStyle') ? { typographyStyle: undefined } : {}),
            ...(allowedTextProps.includes('align') ? { align: undefined } : {}),
            ...(allowedTextProps.includes('ellipsisLineCount') ? { hasEllipsis: undefined } : {}),
        },
        argTypes,
    };
};
