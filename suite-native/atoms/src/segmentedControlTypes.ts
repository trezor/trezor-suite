import { type ReactNode } from 'react';

export type SegmentedControlOption<TValue extends string> = {
    label: ReactNode;
    value: TValue;
};

export type SegmentedControlProps<TValue extends string> = {
    options: Array<SegmentedControlOption<TValue>>;
    selectedValue: TValue;
    onValueChange: (value: TValue) => void;
    isDisabled?: boolean;
    testID?: string;
};

export type NativeSegmentedControlProps<TValue extends string> = Omit<
    SegmentedControlProps<TValue>,
    'options'
> & {
    options: Array<{ label: string; value: TValue }>;
};
