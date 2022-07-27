export type TimeFrameValues = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

export type TimeFrameItem = {
    shortcut: string;
    value: TimeFrameValues;
};

export type TimeFrameItems = Record<TimeFrameValues, TimeFrameItem>;
