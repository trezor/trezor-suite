export type TimeFrameValues = 'hour' | 'day' | 'week' | 'month' | 'year';

export type TimeFrameItem = {
    shortcut: string;
    value: TimeFrameValues;
};

export type TimeFrameItems = Record<TimeFrameValues, TimeFrameItem>;
