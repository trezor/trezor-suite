import { css } from 'styled-components';

import { SpacingValues } from '@trezor/theme';

import { makePropsTransient, TransientProps } from './transientProps';
import type { Flex } from '../components/Flex/Flex';

export type Margin =
    | {
          top?: SpacingValues | 'auto';
          bottom?: SpacingValues | 'auto';
          left?: SpacingValues | 'auto';
          right?: SpacingValues | 'auto';
          horizontal?: SpacingValues | 'auto';
          vertical?: SpacingValues | 'auto';
      }
    | SpacingValues
    | 'auto';

type Padding =
    | {
          top?: SpacingValues;
          bottom?: SpacingValues;
          left?: SpacingValues;
          right?: SpacingValues;
          horizontal?: SpacingValues;
          vertical?: SpacingValues;
      }
    | SpacingValues;

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

const pointerEvents = ['auto', 'none', 'inherit', 'initial', 'unset'] as const;
type PointerEvent = (typeof pointerEvents)[number];

type PositionType = 'relative' | 'absolute' | 'fixed' | 'sticky';
type Position = {
    type: PositionType;
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
};

const cursors = ['pointer', 'help', 'default', 'not-allowed'] as const;
type Cursor = (typeof cursors)[number];

export type FrameProps = {
    margin?: Margin;
    padding?: Padding;
    width?: string | number;
    minWidth?: string | number;
    maxWidth?: string | number;
    height?: string | number;
    minHeight?: string | number;
    maxHeight?: string | number;
    overflow?: Overflow;
    pointerEvents?: PointerEvent;
    flex?: Flex;
    position?: Position;
    cursor?: Cursor;
    zIndex?: number;
};
export type FramePropsKeys = keyof FrameProps;

type TransientFrameProps = TransientProps<FrameProps>;

const getValueWithUnit = (value: string | number) =>
    typeof value === 'string' ? value : `${value}px`;

export const pickAndPrepareFrameProps = (
    props: Record<string, any>,
    allowedFrameProps: Array<FramePropsKeys>,
) =>
    makePropsTransient(
        allowedFrameProps.reduce((acc, item) => ({ ...acc, [item]: props[item] }), {}),
    );

export const withFrameProps = ({
    $margin,
    $padding,
    $minWidth,
    $maxWidth,
    $height,
    $width,
    $minHeight,
    $maxHeight,
    $overflow,
    $pointerEvents,
    $flex,
    $position,
    $cursor,
    $zIndex,
}: TransientFrameProps) => {
    return css`
        ${$margin &&
        (typeof $margin === 'object'
            ? css`
                  margin: ${getValueWithUnit($margin?.top ?? $margin.vertical ?? 0)}
                      ${getValueWithUnit($margin?.right ?? $margin.horizontal ?? 0)}
                      ${getValueWithUnit($margin?.bottom ?? $margin.vertical ?? 0)}
                      ${getValueWithUnit($margin?.left ?? $margin.horizontal ?? 0)};
              `
            : css`
                  margin: ${getValueWithUnit($margin)};
              `)}
        ${$padding &&
        (typeof $padding === 'object'
            ? css`
                  padding: ${getValueWithUnit($padding?.top ?? $padding.vertical ?? 0)}
                      ${getValueWithUnit($padding?.right ?? $padding.horizontal ?? 0)}
                      ${getValueWithUnit($padding?.bottom ?? $padding.vertical ?? 0)}
                      ${getValueWithUnit($padding?.left ?? $padding.horizontal ?? 0)};
              `
            : css`
                  padding: ${getValueWithUnit($padding)};
              `)}
        ${$minWidth &&
        css`
            min-width: ${getValueWithUnit($minWidth)};
        `};
        ${$maxWidth &&
        css`
            max-width: ${getValueWithUnit($maxWidth)};
        `};
        ${$minHeight &&
        css`
            min-height: ${getValueWithUnit($minHeight)};
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
        ${$pointerEvents &&
        css`
            pointer-events: ${$pointerEvents};
        `};
        ${$flex &&
        css`
            flex: ${$flex};
        `};
        ${$position &&
        css`
            position: ${$position.type};
            ${typeof $position.top !== 'undefined' && `top: ${getValueWithUnit($position.top)};`}
            ${typeof $position.right !== 'undefined' &&
            `right: ${getValueWithUnit($position.right)};`}
            ${typeof $position.bottom !== 'undefined' &&
            `bottom: ${getValueWithUnit($position.bottom)};`}
            ${typeof $position.left !== 'undefined' && `left: ${getValueWithUnit($position.left)};`}
        `};
        ${$cursor &&
        css`
            cursor: ${$cursor};
        `};
        ${$zIndex &&
        css`
            z-index: ${$zIndex};
        `}
    `;
};

const getStorybookType = (key: FramePropsKeys) => {
    switch (key) {
        case 'margin':
        case 'padding':
        case 'position':
            return {
                control: {
                    type: 'object',
                },
            };
        case 'width':
        case 'height':
        case 'maxWidth':
        case 'maxHeight':
        case 'flex':
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
        case 'pointerEvents':
            return {
                options: pointerEvents,
                control: {
                    type: 'select',
                },
            };
        case 'cursor':
            return {
                options: cursors,
                control: {
                    type: 'select',
                },
            };
        case 'zIndex':
            return {
                control: {
                    type: 'number',
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
                          horizontal: undefined,
                          vertical: undefined,
                      },
                  }
                : {}),
            ...(allowedFrameProps.includes('padding')
                ? {
                      padding: {
                          top: undefined,
                          right: undefined,
                          bottom: undefined,
                          left: undefined,
                          horizontal: undefined,
                          vertical: undefined,
                      },
                  }
                : {}),
            ...(allowedFrameProps.includes('position')
                ? {
                      position: {
                          type: 'static' as PositionType,
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
            ...(allowedFrameProps.includes('overflow') ? { flex: undefined } : {}),
            ...(allowedFrameProps.includes('pointerEvents') ? { pointerEvents: undefined } : {}),
            ...(allowedFrameProps.includes('cursor') ? { cursor: undefined } : {}),
            ...(allowedFrameProps.includes('zIndex') ? { zIndex: undefined } : {}),
        },
        argTypes,
    };
};
