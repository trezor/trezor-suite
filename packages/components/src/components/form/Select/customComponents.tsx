import { components, ControlProps, OptionProps, GroupHeadingProps } from 'react-select';
import type { Option as OptionType } from './Select';

interface ControlComponentProps extends ControlProps<OptionType, boolean> {
    dataTest?: string;
}

export const Control = ({ dataTest, ...controlProps }: ControlComponentProps) => (
    <components.Control
        {...controlProps}
        innerProps={
            dataTest
                ? ({
                      ...controlProps.innerProps,
                      'data-test': `${dataTest}/input`,
                  } as ControlProps<OptionType>['innerProps'])
                : controlProps.innerProps
        }
    />
);

interface OptionComponentProps extends OptionProps<OptionType, boolean> {
    dataTest?: string;
}

export const Option = ({ dataTest, ...optionProps }: OptionComponentProps) => (
    <components.Option
        {...optionProps}
        innerProps={
            {
                ...optionProps.innerProps,
                'data-test': `${dataTest}/option/${
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
