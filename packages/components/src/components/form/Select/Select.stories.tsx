import { Meta, StoryObj } from '@storybook/react';
import { useArgs } from 'storybook/preview-api';

import { Option, Select as SelectComponent, SelectProps, allowedSelectFrameProps } from './Select';
import { getFramePropsStory } from '../../../utils/frameProps';
import { inputSizes } from '../types';

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

const meta: Meta<typeof SelectComponent> = {
    title: '✏️ Form',
    component: SelectComponent,
};
export default meta;

export const Select: StoryObj<SelectProps> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ option }, updateArgs] = useArgs();
        const setOption = (option2: Option) => updateArgs({ option: option2 });

        return <SelectComponent {...args} value={option} onChange={setOption} options={options} />;
    },
    args: {
        label: 'Label',
        hasError: false,
        isDisabled: false,
        isSearchable: false,
        isLoading: false,
        isClean: false,
        size: 'large',
        isMenuOpen: undefined,
        ...getFramePropsStory(allowedSelectFrameProps).args,
    },
    argTypes: {
        label: { control: 'text' },
        isDisabled: {
            control: 'boolean',
        },
        isSearchable: {
            control: 'boolean',
        },
        isLoading: {
            control: 'boolean',
        },
        isClean: {
            control: 'boolean',
        },
        bottomText: {
            control: { type: 'text' },
        },
        labelHoverRight: { control: 'text' },
        labelLeft: { control: 'text' },
        labelRight: { control: 'text' },
        size: {
            control: {
                type: 'select',
            },
            options: inputSizes,
        },
        minValueWidth: {
            control: 'number',
        },
        isMenuOpen: {
            control: 'boolean',
        },
        hasError: { control: 'boolean' },
        placeholder: {
            control: 'text',
        },
        'data-testid': {
            control: 'text',
        },
        ...getFramePropsStory(allowedSelectFrameProps).argTypes,
    },
};
