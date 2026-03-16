import type { Meta, StoryObj } from '@storybook/react-native';
import { useArgs } from 'storybook/preview-api';

import { CheckBox as CheckBoxComponent, type CheckBoxProps } from '../../CheckBox';

type CheckBoxStory = StoryObj<CheckBoxProps>;

const meta: Meta<CheckBoxProps> = {
    title: 'Atoms/Inputs',
    component: CheckBoxComponent,
    render: args => {
        const [{ isChecked }, updateArgs] = useArgs();

        return (
            <CheckBoxComponent
                {...args}
                isChecked={isChecked}
                onChange={() => updateArgs({ isChecked: !isChecked })}
            />
        );
    },
};

export default meta;

export const CheckBox: CheckBoxStory = {
    name: 'CheckBox',
    args: {
        isChecked: true,
        isDisabled: false,
        onChange: () => {},
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
