import { useRef } from 'react';
import { ControlProps, GroupBase, GroupHeadingProps, OptionProps, components } from 'react-select';
import { useDeepCompareEffect } from 'react-use';

import { deepEqual } from '@trezor/utils';

export type ControlComponentProps<O> = ControlProps<O, boolean, GroupBase<O>> & {
    'data-testid'?: string;
};

export const Control = <O,>({ 'data-testid': dataTest, ...controlProps }: ControlComponentProps<O>) => (
    <components.Control
        {...(controlProps as any)}
        innerProps={
            dataTest
                ? ({
                      ...controlProps.innerProps,
                      'data-testid': `${dataTest}/input`,
                  } as ControlProps<O>['innerProps'])
                : controlProps.innerProps
        }
    />
);

export type OptionComponentProps<O> = OptionProps<O, boolean, GroupBase<O>> & {
    'data-testid'?: string;
    selectedOption?: any;
};

export const Option = <O,>({
    selectedOption,
    'data-testid': dataTest,
    ...props
}: OptionComponentProps<O>) => {
    const ref = useRef<HTMLDivElement>(undefined);

    useDeepCompareEffect(() => {
        if (deepEqual(props.data, selectedOption)) {
            ref.current?.scrollIntoView();
        }
    }, [{}]);

    return (
        <components.Option
            {...(props as any)}
            innerRef={ref as any}
            innerProps={
                {
                    ...props.innerProps,
                    'data-testid': `${dataTest}/option/${
                        typeof (props as any).data.value === 'string' ? (props as any).data.value : String(props.label)
                    }`,
                } as OptionProps<O, boolean>['innerProps']
            }
        />
    );
};

export const GroupHeading = <O,>(groupHeadingProps: GroupHeadingProps<O, boolean, GroupBase<O>>) => (
    <components.GroupHeading {...(groupHeadingProps as any)} />
);
