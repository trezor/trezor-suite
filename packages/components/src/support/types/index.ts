export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface FeedbackVariant {
    variant?: 'success' | 'info' | 'warning' | 'error';
}

export interface FeedbackState {
    state?: 'success' | 'info' | 'warning' | 'error';
}

export interface IconShape {
    paths: string[];
    viewBox: string;
    ratio?: number;
}
