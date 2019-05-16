export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface IconShape {
    paths: string[];
    viewBox: string;
    ratio?: number;
}
