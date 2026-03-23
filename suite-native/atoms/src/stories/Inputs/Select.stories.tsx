import { type Meta, type StoryObj } from '@storybook/react-native';
import { useArgs } from 'storybook/preview-api';

import {
    Select as SelectComponent,
    type SelectItemType,
    type SelectProps,
} from '../../Select/Select';

const OPTIONS = ['option1', 'option2', 'option3'] as const;
type SelectValue = (typeof OPTIONS)[number];

type SelectArgs = SelectProps<SelectValue>;
type SelectStory = StoryObj<SelectArgs>;

const items: SelectItemType<SelectValue>[] = [
    { value: OPTIONS[0], label: 'Option 1' },
    { value: OPTIONS[1], label: 'Option 2' },
    { value: OPTIONS[2], label: 'Option 3' },
];

const meta: Meta<SelectArgs> = {
    title: 'Atoms/Inputs',
    render: args => {
        const [{ value }, updateArgs] = useArgs<SelectArgs>();

        return (
            <SelectComponent
                {...args}
                value={value}
                onSelectItem={(selectedValue: SelectValue) => updateArgs({ value: selectedValue })}
            />
        );
    },
};

export default meta;

export const Select: SelectStory = {
    name: 'Select',
    args: {
        title: 'Label',
        value: 'option1',
        isLabelShown: true,
        isConfirmable: false,
        items,
    },
    argTypes: {
        title: {
            control: { type: 'text' },
        },
        value: {
            options: Object.values(OPTIONS),
            control: { type: 'select' },
        },
        isConfirmable: {
            control: { type: 'boolean' },
        },
        isLabelShown: {
            control: { type: 'boolean' },
        },
        items: {
            control: { type: 'object' },
        },
    },
};
