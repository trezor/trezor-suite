import React from 'react';
import { useArgs } from '@storybook/client-api';

import { SelectBar as SelectBarComponent } from './SelectBar';

const options = [
    { label: 'low', value: 'low' },
    { label: 'medium', value: 'medium' },
    { label: 'high', value: 'high' },
    { label: 'custom', value: 'custom' },
];

export default {
    title: 'Form/SelectBar',
    argTypes: {
        option: {
            control: {
                options: options.map(option => option.value),
                type: 'radio',
            },
        },
    },
    args: { option: 'low', label: 'fee' },
};

export const SelectBar = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ option }, updateArgs] = useArgs();
        const setOption = (option: string) => updateArgs({ option });

        return (
            <SelectBarComponent
                label={args.label}
                selectedOption={option}
                options={options}
                onChange={setOption}
            />
        );
    },
};
