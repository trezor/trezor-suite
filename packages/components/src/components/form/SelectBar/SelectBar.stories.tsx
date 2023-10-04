import { useArgs } from '@storybook/client-api';
import { StoryObj } from '@storybook/react';

import { SelectBar as SelectBarComponent, SelectBarProps } from './SelectBar';

const options = [
    { label: 'low', value: 'low' },
    { label: 'medium', value: 'medium' },
    { label: 'high', value: 'high' },
    { label: 'custom', value: 'custom' },
];

export default {
    title: 'Form/SelectBar',
    args: { selectedOption: 'low', label: 'fee' },
    component: SelectBarComponent,
};

export const SelectBar: StoryObj<SelectBarProps<string>> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [_, updateArgs] = useArgs<SelectBarProps<string>>();
        const setOption = (selectedOption: string) => updateArgs({ selectedOption });

        return <SelectBarComponent {...args} onChange={setOption} options={options} />;
    },
    argTypes: {
        className: { control: { disable: true } },
        options: { control: { disable: true } },
        selectedOption: { control: { disable: true } },
    },
};
