import { css } from 'styled-components';

import {
    type BorderRadii,
    type SpacingValues,
    type SpacingValuesNew,
    borders,
} from '@trezor/theme';

import { type TransientProps, makePropsTransient } from './transientProps';
import type { FlexType } from '../components/Flex/FlexProp';

export type Margin =
    | {
          top?: SpacingValues | SpacingValuesNew | 'auto';
          bottom?: SpacingValues | SpacingValuesNew | 'auto';
          left?: SpacingValues | SpacingValuesNew | 'auto';
          right?: SpacingValues | SpacingValuesNew | 'auto';
          horizontal?: SpacingValues | SpacingValuesNew | 'auto';
          vertical?: SpacingValues | SpacingValuesNew | 'auto';
      }
    | SpacingValues
    | SpacingValuesNew
    | 'auto';

export type Padding =
    | {
          top?: SpacingValues | SpacingValuesNew;
          bottom?: SpacingValues | SpacingValuesNew;
          left?: SpacingValues | SpacingValuesNew;
          right?: SpacingValues | SpacingValuesNew;
          horizontal?: SpacingValues | SpacingValuesNew;
          vertical?: SpacingValues | SpacingValuesNew;
      }
    | SpacingValues
    | SpacingValuesNew;

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

type OverflowValue = (typeof overflows)[number];
type Overflow = OverflowValue | `${OverflowValue} ${OverflowValue}`;

const pointerEvents = ['auto', 'none', 'inherit', 'initial', 'unset'] as const;
type PointerEvent = (typeof pointerEvents)[number];

type PositionType = 'relative' | 'absolute' | 'fixed' | 'sticky';
type Position = {
    type: PositionType;
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
    inset?: string | number;
};

const cursors = ['pointer', 'help', 'default', 'not-allowed', 'inherit', 'text', 'auto'] as const;
type Cursor = (typeof cursors)[number];

const userSelects = ['none', 'text', 'all', 'auto', 'inherit'] as const;
type UserSelect = (typeof userSelects)[number];

const objectFits = ['none', 'fill', 'contain', 'cover', 'scale-down'] as const;
export type ObjectFit = (typeof objectFits)[number];

const displays = ['block', 'inline', 'inline-block', 'flex', 'inline-flex'] as const;
export type Display = (typeof displays)[number];

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
    borderRadius?: BorderRadii;
    pointerEvents?: PointerEvent;
    flex?: FlexType;
    position?: Position;
    cursor?: Cursor;
    zIndex?: number;
    opacity?: number;
    aspectRatio?: `${number}` | `${number} / ${number}`;
    userSelect?: UserSelect;
    objectFit?: ObjectFit;
    display?: Display;
};
export type FramePropsKeys = keyof FrameProps;

type TransientFrameProps = TransientProps<FrameProps>;

const getValueWithUnit = (value: string | number) =>
    typeof value === 'number' ? `${value}px` : value;

export const pickAndPrepareFrameProps = <
    TProps extends { [K in FramePropsKeys]?: FrameProps[K] },
    KFP extends FramePropsKeys[],
>(
    props: TProps,
    allowedFrameProps: KFP,
    makeTransient: boolean = true,
) => {
    const selectedProps = allowedFrameProps.reduce<{
        [value in KFP[number]]: TProps[value];
    }>(
        (acc, item) => ({ ...acc, [item]: props[item] }),
        {} as { [value in KFP[number]]: TProps[value] },
    );

    return makeTransient ? makePropsTransient(selectedProps) : selectedProps;
};

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
    $borderRadius,
    $pointerEvents,
    $flex,
    $position,
    $cursor,
    $zIndex,
    $aspectRatio,
    $opacity,
    $userSelect,
    $objectFit,
    $display,
}: TransientFrameProps) => css`
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
    ${typeof $minWidth !== 'undefined' &&
    css`
        min-width: ${getValueWithUnit($minWidth)};
    `};
    ${typeof $maxWidth !== 'undefined' &&
    css`
        max-width: ${getValueWithUnit($maxWidth)};
    `};
    ${typeof $minHeight !== 'undefined' &&
    css`
        min-height: ${getValueWithUnit($minHeight)};
    `};
    ${typeof $maxHeight !== 'undefined' &&
    css`
        max-height: ${getValueWithUnit($maxHeight)};
    `};
    ${typeof $width !== 'undefined' &&
    css`
        width: ${getValueWithUnit($width)};
    `};
    ${typeof $height !== 'undefined' &&
    css`
        height: ${getValueWithUnit($height)};
    `};
    ${$overflow &&
    css`
        overflow: ${$overflow};
    `};
    ${$borderRadius &&
    css`
        border-radius: ${getValueWithUnit($borderRadius)};
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
        ${typeof $position.inset !== 'undefined' && `inset: ${getValueWithUnit($position.inset)};`}
        ${typeof $position.top !== 'undefined' && `top: ${getValueWithUnit($position.top)};`}
        ${typeof $position.right !== 'undefined' && `right: ${getValueWithUnit($position.right)};`}
            ${typeof $position.bottom !== 'undefined' &&
        `bottom: ${getValueWithUnit($position.bottom)};`}
            ${typeof $position.left !== 'undefined' && `left: ${getValueWithUnit($position.left)};`}
    `};
    ${$cursor &&
    css`
        cursor: ${$cursor};
    `};
    ${typeof $zIndex !== 'undefined' &&
    css`
        z-index: ${$zIndex};
    `};
    ${typeof $aspectRatio !== 'undefined' &&
    css`
        aspect-ratio: ${$aspectRatio};
    `};
    ${typeof $opacity !== 'undefined' &&
    css`
        opacity: ${$opacity};
    `};
    ${$userSelect &&
    css`
        user-select: ${$userSelect};
    `};
    ${$objectFit &&
    css`
        object-fit: ${$objectFit};
    `};
    ${$display &&
    css`
        display: ${$display};
    `};
`;

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
        case 'aspectRatio':
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
        case 'borderRadius':
            return {
                options: borders.radii,
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
        case 'opacity':
            return {
                control: {
                    type: 'number',
                },
            };
        case 'userSelect':
            return {
                options: userSelects,
                control: {
                    type: 'select',
                },
            };
        case 'objectFit':
            return {
                options: objectFits,
                control: {
                    type: 'select',
                },
            };
        case 'display':
            return {
                options: displays,
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
            ...(allowedFrameProps.includes('borderRadius') ? { borderRadius: undefined } : {}),
            ...(allowedFrameProps.includes('flex') ? { flex: undefined } : {}),
            ...(allowedFrameProps.includes('pointerEvents') ? { pointerEvents: undefined } : {}),
            ...(allowedFrameProps.includes('cursor') ? { cursor: undefined } : {}),
            ...(allowedFrameProps.includes('zIndex') ? { zIndex: undefined } : {}),
            ...(allowedFrameProps.includes('opacity') ? { opacity: undefined } : {}),
            ...(allowedFrameProps.includes('aspectRatio') ? { aspectRatio: undefined } : {}),
            ...(allowedFrameProps.includes('userSelect') ? { userSelect: undefined } : {}),
            ...(allowedFrameProps.includes('objectFit') ? { objectFit: undefined } : {}),
            ...(allowedFrameProps.includes('display') ? { display: undefined } : {}),
        },
        argTypes,
    };
};
