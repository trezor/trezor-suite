import { type Meta, type StoryObj } from '@storybook/react';
import { useArgs } from 'storybook/preview-api';

import {
    type Option,
    Select as SelectComponent,
    type SelectProps,
    allowedSelectFrameProps,
} from './Select';
import { getFramePropsStory } from '../../../utils/frameProps';
import { inputSizes } from '../types';

const groupedValues: Record<string, Record<string, Option>> = {
    Common: {
        Low: { label: 'Low', value: 'low' },
        Medium: { label: 'Medium', value: 'medium' },
        High: { label: 'High', value: 'high' },
        Custom: { label: 'Custom', value: 'custom' },
        Auto: { label: 'Auto', value: 'auto' },
        Default: { label: 'Default', value: 'default' },
    },
    Performance: {
        Eco: { label: 'Eco', value: 'eco' },
        Balanced: { label: 'Balanced', value: 'balanced' },
        Turbo: { label: 'Turbo', value: 'turbo' },
        Extreme: { label: 'Extreme', value: 'extreme' },
        Burst: { label: 'Burst', value: 'burst' },
        Sustained: { label: 'Sustained', value: 'sustained' },
    },
    Security: {
        Standard: { label: 'Standard', value: 'standard' },
        Strict: { label: 'Strict', value: 'strict' },
        Hardened: { label: 'Hardened', value: 'hardened' },
        Maximum: { label: 'Maximum', value: 'maximum' },
        Paranoid: { label: 'Paranoid', value: 'paranoid' },
        Lockdown: { label: 'Lockdown', value: 'lockdown' },
    },
    Network: {
        Offline: { label: 'Offline', value: 'offline' },
        Limited: { label: 'Limited', value: 'limited' },
        Normal: { label: 'Normal', value: 'normal' },
        Preferred: { label: 'Preferred', value: 'preferred' },
        Priority: { label: 'Priority', value: 'priority' },
        Realtime: { label: 'Realtime', value: 'realtime' },
    },
};

const groupedOptions = Object.entries(groupedValues).map(([label, values]) => ({
    label,
    options: Object.values(values),
}));

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

        return (
            <SelectComponent
                {...args}
                value={option}
                onChange={setOption}
                options={groupedOptions}
            />
        );
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
