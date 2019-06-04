export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type FeedbackType = 'success' | 'info' | 'warning' | 'error';

export interface IconShape {
    paths: string[];
    viewBox: string;
    ratio?: number;
}
