export function union<T extends string | number>(data: T[]) {
    return [...new Set(data)];
}
