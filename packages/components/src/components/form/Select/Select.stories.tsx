import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

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

const meta: Meta = {
    title: 'Form',
    component: SelectComponent,
} as Meta;
export default meta;

export const Select: StoryObj<SelectProps> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ option }, updateArgs] = useArgs();
        const setOption = (option: { label: string; value: 'string' }) => updateArgs({ option });

        return <SelectComponent {...args} value={option} onChange={setOption} options={options} />;
    },
    args: {
        label: 'Label',
        isClean: false,
        isDisabled: false,
        isSearchable: false,
        hasBottomPadding: true,
        size: 'large',
        minValueWidth: 'initial',
        isMenuOpen: undefined,
        useKeyPressScroll: undefined,
    },
    argTypes: {
        label: {
            table: {
                type: {
                    summary: 'ReactNode',
                },
            },
        },
        isClean: {
            control: {
                type: 'boolean',
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        isSearchable: {
            control: {
                type: 'boolean',
            },
        },
        bottomText: {
            control: { type: 'text' },
        },
        hasBottomPadding: {
            control: {
                type: 'boolean',
            },
        },
        size: {
            control: {
                type: 'radio',
            },
            options: ['large', 'small'],
        },
        minValueWidth: {
            control: { type: 'text' },
        },
        isMenuOpen: {
            control: {
                type: 'boolean',
            },
        },
        useKeyPressScroll: {
            control: {
                type: 'boolean',
            },
        },
        inputState: {
            control: {
                type: 'radio',
            },
            options: [null, 'warning', 'error'],
        },
        placeholder: {
            control: { type: 'text' },
        },
    },
};
