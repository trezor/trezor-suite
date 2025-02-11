import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import {
    DEFAULT_ORIENTATION,
    SelectBar as SelectBarComponent,
    SelectBarProps,
    orientations,
} from './SelectBar';

const options = [
    { label: 'low', value: 'low' },
    { label: 'medium', value: 'medium' },
    { label: 'high', value: 'high' },
    { label: 'custom', value: 'custom' },
];

const meta: Meta<typeof SelectBarComponent> = {
    title: 'Form',
    component: SelectBarComponent,
    args: {
        label: 'fee',
        options,
        selectedOption: 'low',
        isDisabled: false,
        isFullWidth: undefined,
        orientation: DEFAULT_ORIENTATION,
    },
    argTypes: {
        label: {
            control: {
                type: 'text',
            },
        },
        options: {
            control: {
                type: 'array',
            },
            table: {
                type: {
                    summary: 'Array<{ label: string; value: number }>',
                },
            },
        },
        selectedOption: {
            control: {
                type: 'text',
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        isFullWidth: {
            control: {
                type: 'boolean',
            },
        },
        orientation: {
            options: orientations,
            control: {
                type: 'radio',
            },
        },
    },
};

export default meta;

export const SelectBar: StoryObj<typeof SelectBarComponent> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [_, updateArgs] = useArgs<SelectBarProps<string>>();
        const setOption = (selectedOption: string) => updateArgs({ selectedOption });

        return <SelectBarComponent {...args} onChange={setOption} options={options} />;
    },
};
