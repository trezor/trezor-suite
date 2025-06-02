import { useRef } from 'react';
import { ControlProps, GroupHeadingProps, OptionProps, components } from 'react-select';
import { useDeepCompareEffect } from 'react-use';

import { deepEqual } from '@trezor/utils';

import type { Option as OptionType } from './Select';

export interface ControlComponentProps extends ControlProps<OptionType, boolean> {
    'data-testid'?: string;
}

export const Control = ({ 'data-testid': dataTest, ...controlProps }: ControlComponentProps) => (
    <components.Control
        {...controlProps}
        innerProps={
            dataTest
                ? ({
                      ...controlProps.innerProps,
                      'data-testid': `${dataTest}/input`,
                  } as ControlProps<OptionType>['innerProps'])
                : controlProps.innerProps
        }
    />
);

export interface OptionComponentProps extends OptionProps<OptionType, boolean> {
    'data-testid'?: string;
    selectedOption?: any;
}

export const Option = ({
    selectedOption,
    'data-testid': dataTest,
    ...props
}: OptionComponentProps) => {
    const ref = useRef<HTMLDivElement>();

    useDeepCompareEffect(() => {
        if (deepEqual(props.data, selectedOption)) {
            ref.current?.scrollIntoView();
        }
    }, [{}]);

    return (
        <components.Option
            {...props}
            innerRef={ref as any}
            innerProps={
                {
                    ...props.innerProps,
                    'data-testid': `${dataTest}/option/${
                        typeof props.data.value === 'string' ? props.data.value : props.label
                    }`,
                } as OptionProps<OptionType, boolean>['innerProps']
            }
        />
    );
};

export const GroupHeading = (groupHeadingProps: GroupHeadingProps<OptionType>) => (
    <components.GroupHeading {...groupHeadingProps} />
);
