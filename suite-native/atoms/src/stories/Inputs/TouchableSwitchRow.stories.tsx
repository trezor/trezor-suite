import type { Meta, StoryObj } from '@storybook/react-native';
import { useArgs } from 'storybook/preview-api';

import { ICON_NAMES } from '@suite-native/icons';

import {
    TouchableSwitchRow as TouchableSwitchRowComponent,
    type TouchableSwitchRowProps,
} from '../../TouchableSwitchRow';

type TouchableSwitchRowStory = StoryObj<TouchableSwitchRowProps>;

const meta: Meta<TouchableSwitchRowProps> = {
    title: 'Atoms/Inputs',
    component: TouchableSwitchRowComponent,
    render: args => {
        const [{ isChecked }, updateArgs] = useArgs();

        return (
            <TouchableSwitchRowComponent
                {...args}
                isChecked={isChecked}
                onChange={() => updateArgs({ isChecked: !isChecked })}
            />
        );
    },
};

export default meta;

export const TouchableSwitchRow: TouchableSwitchRowStory = {
    name: 'TouchableSwitchRow',
    args: {
        isChecked: true,
        icon: 'info',
        text: 'Toggle label',
        description: 'Toggle description that is more detailed.',
        accessibilityLabel: 'Info',
    },
    argTypes: {
        isChecked: {
            control: { type: 'boolean' },
        },
        icon: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        text: {
            control: { type: 'text' },
        },
        description: {
            control: { type: 'text' },
        },
        accessibilityLabel: {
            control: false,
        },
    },
};
