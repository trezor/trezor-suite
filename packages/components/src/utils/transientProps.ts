export type TransientProps<T> = {
    [Key in keyof T as `$${Key & string}`]: T[Key];
};
