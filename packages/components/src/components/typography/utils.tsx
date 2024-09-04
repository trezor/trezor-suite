import { typography, TypographyStyle, typographyStyles } from '@trezor/theme';
import { TransientProps } from '../../utils/transientProps';
import { css } from 'styled-components';

export const textWraps = ['balance', 'break-word'];
export type TextWrap = (typeof textWraps)[number];

export type TextProps = {
    typographyStyle?: TypographyStyle;
    textWrap?: TextWrap;
};

export type TextPropsKeys = keyof TextProps;

type TransientTextProps = TransientProps<TextProps>;

export const withTextProps = ({ $textWrap, $typographyStyle }: TransientTextProps) => {
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
        },
        argTypes,
    };
};
