import { css } from 'styled-components';
import { TransientProps } from '../../utils/transientProps';
import { SpacingValues } from '@trezor/theme';

type Margin = {
    top?: SpacingValues;
    bottom?: SpacingValues;
    left?: SpacingValues;
    right?: SpacingValues;
};

export type FrameProps = {
    margin?: Margin;
    width?: string | number;
    maxWidth?: string | number;
    height?: string | number;
    maxHeight?: string | number;
};

export type TransientFrameProps = TransientProps<FrameProps>;

const getValueWithUnit = (value: string | number) =>
    typeof value === 'string' ? value : `${value}px`;

export const withFrameProps = ({
    $margin,
    $maxWidth,
    $height,
    $width,
    $maxHeight,
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
    `;
};

export const getFramePropsStory = (allowedFrameProps: Array<keyof FrameProps>) => {
    const argTypes = allowedFrameProps.reduce(
        (acc, key) => ({
            ...acc,
            [key]: {
                table: {
                    category: 'Frame props',
                },
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
        },
        argTypes,
    };
};
