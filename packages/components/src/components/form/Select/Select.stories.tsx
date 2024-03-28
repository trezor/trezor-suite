import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import { Select as SelectComponent, SelectProps } from './Select';
import { OptionFloatingUi, SelectFloatingUi } from './SelectFloatingUi';
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';

const Flex = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.lg};
`

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
    title: 'Form/Select',
    component: SelectComponent,
} as Meta;
export default meta;

export const Select: StoryObj<SelectProps> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ option }, updateArgs] = useArgs();
        const setOption = (option: { label: string; value: 'string' }) => updateArgs({ option });

        return (
            <Flex>
                <SelectComponent {...args} value={option} onChange={setOption} options={options} />
                <SelectFloatingUi>
                    <OptionFloatingUi label="Apple" />
                    <OptionFloatingUi label="Blueberry" />
                    <OptionFloatingUi label="Watermelon" />
                    <OptionFloatingUi label="Banana" />
                </Select>
            </Flex>
        );
    },
    argTypes: {
        isSearchable: {
            control: {
                type: 'boolean',
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        bottomText: {
            control: { type: 'text' },
        },
        size: {
            control: {
                options: { 'Large (default)': null, Small: 'small' },
                type: 'radio',
            },
        },
        label: {
            control: { type: 'text' },
        },
        placeholder: {
            control: { type: 'text' },
        },
    },
    args: {
        label: 'Label',
    },
};
