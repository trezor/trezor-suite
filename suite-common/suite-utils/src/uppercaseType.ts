export function toUppercaseType<T extends string>(value: T): Uppercase<T> {
    return value.toUpperCase() as Uppercase<T>;
}
