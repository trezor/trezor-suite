/**
 * @deprecated Use only for legacy code, where refactoring is too complicated.
 *             Styled Components should have their own set of props, with their
 *             own abstraction.
 *
 *             For example: `deviceType` shall not be passed into Styled Component
 *             to check if device is Trezor One to make border bigger. Instead the
 *             Styled Component shall have prop `biggerBorder`.
 **/
export type TransientProps<T> = {
    [Key in keyof T as `$${Key & string}`]: T[Key];
};
