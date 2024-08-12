import { components, ControlProps, OptionProps, GroupHeadingProps } from 'react-select';
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
}

export const Option = ({ 'data-testid': dataTest, ...optionProps }: OptionComponentProps) => (
    <components.Option
        {...optionProps}
        innerProps={
            {
                ...optionProps.innerProps,
                'data-testid': `${dataTest}/option/${
                    typeof optionProps.data.value === 'string'
                        ? optionProps.data.value
                        : optionProps.label
                }`,
            } as OptionProps<OptionType, boolean>['innerProps']
        }
    />
);

export const GroupHeading = (groupHeadingProps: GroupHeadingProps<OptionType>) => (
    <components.GroupHeading {...groupHeadingProps} />
);
