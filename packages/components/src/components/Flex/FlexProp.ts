export const flexDirection = ['column', 'row'] as const;
export const flexWrap = ['nowrap', 'wrap', 'wrap-reverse'] as const;

export const flexJustifyContent = [
    'center',
    'end',
    'flex-end',
    'flex-start',
    'left',
    'right',
    'space-around',
    'space-between',
    'space-evenly',
    'start',
    'stretch',
] as const;

export const flexAlignItems = [
    'baseline',
    'center',
    'end',
    'first baseline',
    'flex-end',
    'flex-start',
    'last baseline',
    'self-end',
    'self-start',
    'start',
    'stretch',
    'normal',
] as const;

export const flexAlignSelf = [
    'auto',
    'stretch',
    'center',
    'flex-start',
    'flex-end',
    'baseline',
    'initial',
    'inherit',
] as const;

export type FlexDirection = (typeof flexDirection)[number];
export type FlexJustifyContent = (typeof flexJustifyContent)[number];
export type FlexAlignItems = (typeof flexAlignItems)[number];
export type FlexAlignSelf = (typeof flexAlignSelf)[number];
export type FlexType =
    | 'none'
    | 'auto'
    | 'initial'
    | 'inherit'
    | `${number}`
    | `${number} ${number}`
    | `${number} ${number} ${string}`;
export type FlexWrap = (typeof flexWrap)[number];
