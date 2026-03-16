import type { Meta, StoryObj } from '@storybook/react-native';
import { useArgs } from 'storybook/preview-api';

import { Switch as SwitchComponent, type SwitchProps } from '../../Switch';

type SwitchStory = StoryObj<SwitchProps>;

const meta: Meta<SwitchProps> = {
    title: 'Atoms/Inputs',
    component: SwitchComponent,
    render: args => {
        const [{ isChecked }, updateArgs] = useArgs();

        return (
            <SwitchComponent
                {...args}
                isChecked={isChecked}
                onChange={() => updateArgs({ isChecked: !isChecked })}
            />
        );
    },
};

export default meta;

export const Switch: SwitchStory = {
    name: 'Switch',
    args: {
        isChecked: true,
        isDisabled: false,
    },
    argTypes: {
        isChecked: {
            control: { type: 'boolean' },
        },
        isDisabled: {
            control: { type: 'boolean' },
        },
    },
};
