import { type Meta, type StoryObj } from '@storybook/react-native';
import { useArgs } from 'storybook/preview-api';

import { Radio as RadioComponent, type RadioProps } from '../../Radio';

type RadioStory = StoryObj<RadioProps<number>>;

const meta: Meta<RadioProps<number>> = {
    title: 'Atoms/Inputs',
    component: RadioComponent<number>,
    render: args => {
        const [{ isChecked }, updateArgs] = useArgs();

        return (
            <RadioComponent
                {...args}
                isChecked={isChecked}
                onPress={() => updateArgs({ isChecked: !isChecked })}
            />
        );
    },
};

export default meta;

export const Radio: RadioStory = {
    name: 'Radio',
    args: {
        value: 1,
        isChecked: true,
        isDisabled: false,
        activeColor: 'backgroundPrimaryDefault',
    },
    argTypes: {
        value: {
            control: false,
        },
        isChecked: {
            control: { type: 'boolean' },
        },
        isDisabled: {
            control: { type: 'boolean' },
        },
        activeColor: {
            control: { type: 'color' },
        },
    },
};
