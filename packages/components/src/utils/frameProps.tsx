import { css } from 'styled-components';
import { TransientProps } from './transientProps';
import { SpacingValues } from '@trezor/theme';

type Margin = {
    top?: SpacingValues;
    bottom?: SpacingValues;
    left?: SpacingValues;
    right?: SpacingValues;
};
const overflows = [
    'auto',
    'hidden',
    'scroll',
    'visible',
    'inherit',
    'initial',
    'unset',
    'clip',
    'no-display',
    'no-content',
    'no-scroll',
] as const;

type Overflow = (typeof overflows)[number];

export type FrameProps = {
    margin?: Margin;
    width?: string | number;
    minWidth?: string | number;
    maxWidth?: string | number;
    height?: string | number;
    minHeight?: string | number;
    maxHeight?: string | number;
    overflow?: Overflow;
};
export type FramePropsKeys = keyof FrameProps;

type TransientFrameProps = TransientProps<FrameProps>;

const getValueWithUnit = (value: string | number) =>
    typeof value === 'string' ? value : `${value}px`;

export const withFrameProps = ({
    $margin,
    $maxWidth,
    $height,
    $width,
    $maxHeight,
    $overflow,
}: TransientFrameProps) => {
    return css`
        ${$margin &&
        css`
            ${$margin.top ? `margin-top: ${$margin.top}px;` : ''}
            ${$margin.bottom ? `margin-bottom: ${$margin.bottom}px;` : ''}
            ${$margin.left ? `margin-left: ${$margin.left}px;` : ''}
            ${$margin.right ? `margin-right: ${$margin.right}px;` : ''}
        `}

        ${$maxWidth &&
        css`
            max-width: ${getValueWithUnit($maxWidth)};
        `};
        ${$maxHeight &&
        css`
            max-height: ${getValueWithUnit($maxHeight)};
        `};
        ${$width &&
        css`
            width: ${getValueWithUnit($width)};
        `};
        ${$height &&
        css`
            height: ${getValueWithUnit($height)};
        `};
        ${$overflow &&
        css`
            overflow: ${$overflow};
        `};
    `;
};

const getStorybookType = (key: FramePropsKeys) => {
    switch (key) {
        case 'margin':
            return {
                control: {
                    type: 'object',
                },
            };
        case 'width':
        case 'height':
        case 'maxWidth':
        case 'maxHeight':
            return {
                control: {
                    type: 'text',
                },
            };
        case 'overflow':
            return {
                options: overflows,
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

export const getFramePropsStory = (allowedFrameProps: Array<FramePropsKeys>) => {
    const argTypes = allowedFrameProps.reduce(
        (acc, key) => ({
            ...acc,
            [key]: {
                table: {
                    category: 'Frame props',
                },
                ...getStorybookType(key),
            },
        }),
        {},
    );

    return {
        args: {
            ...(allowedFrameProps.includes('margin')
                ? {
                      margin: {
                          top: undefined,
                          right: undefined,
                          bottom: undefined,
                          left: undefined,
                      },
                  }
                : {}),
            ...(allowedFrameProps.includes('width') ? { width: undefined } : {}),
            ...(allowedFrameProps.includes('height') ? { height: undefined } : {}),
            ...(allowedFrameProps.includes('maxWidth') ? { maxWidth: undefined } : {}),
            ...(allowedFrameProps.includes('maxHeight') ? { maxHeight: undefined } : {}),
            ...(allowedFrameProps.includes('overflow') ? { overflow: undefined } : {}),
        },
        argTypes,
    };
};
