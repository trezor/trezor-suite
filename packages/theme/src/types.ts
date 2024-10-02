export type CSSColor =
    | `#${string}`
    | `rgb(${number}, ${number}, ${number})`
    | `rgba(${number}, ${number}, ${number}, ${number})`
    | 'transparent'
    | 'currentColor';
