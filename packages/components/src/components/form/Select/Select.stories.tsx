import { useArgs } from '@storybook/client-api';
import { StoryObj } from '@storybook/react';

import { Select as SelectComponent, SelectProps } from './Select';

const values: any = {
    'None (default)': null,
    Low: { label: 'low', value: 'low' },
    Medium: { label: 'medium', value: 'medium' },
    High: { label: 'high', value: 'high' },
    Custom: { label: 'custom', value: 'custom' },
};

const options = Object.keys(values)
    .filter((k: string) => values[k])
    .map((k: string) => values[k]);

export default {
    title: 'Form/Select',
    argTypes: {
        option: {
            control: {
                disable: true,
            },
        },
        variant: {
            control: {
                options: { 'Large (default)': null, Small: 'small' },
                type: 'radio',
            },
        },
    },
    args: {
        option: 'low',
        variant: null,
        isSearchable: false,
        isClearable: false,
        isClean: false,
        isDisabled: false,
        withDropdownIndicator: true,
    },
};

export const Select: StoryObj<SelectProps> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ option }, updateArgs] = useArgs();
        const setOption = (option: { label: string; value: 'string' }) => updateArgs({ option });

        return (
            <SelectComponent
                isSearchable={args.isSearchable}
                isClearable={args.isClearable}
                isClean={args.isClean}
                isDisabled={args.isDisabled}
                withDropdownIndicator={args.withDropdownIndicator}
                size={args.variant}
                value={option}
                onChange={setOption}
                options={options}
            />
        );
    },
};
