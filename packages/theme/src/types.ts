export type CSSColor =
    | `#${string}`
    | `rgb(${number}, ${number}, ${number})`
    | `rgba(${number}, ${number}, ${number}, ${number})`
    | 'transparent';

export const isCSSColor = (color: string): color is CSSColor => {
    const cssColorRegex =
        /^#([0-9a-fA-F]{3,8})$|^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),?\s*(\d{1,3})\)$/;
    return cssColorRegex.test(color);
};
