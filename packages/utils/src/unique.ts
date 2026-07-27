export function unique<T extends string | number>(data: T[]) {
    return [...new Set(data)];
}
