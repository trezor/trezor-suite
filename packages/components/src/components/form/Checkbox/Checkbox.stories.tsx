import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import { Checkbox as CheckboxComponent, CheckboxProps } from './Checkbox';
import { framePropsStory } from '../../common/frameProps';

const meta: Meta = {
    title: 'Form/Checkbox',
    component: CheckboxComponent,
} as Meta;
export default meta;

export const Checkbox: StoryObj<CheckboxProps> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ isChecked }, updateArgs] = useArgs();
        const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

        return (
            <CheckboxComponent
                variant="primary"
                isChecked={isChecked}
                {...args}
                onClick={handleIsChecked}
            >
                {args.children}
            </CheckboxComponent>
        );
    },
    args: {
        children: 'Checkbox',
        variant: 'primary',
        isChecked: false,
        isDisabled: false,
        labelAlignment: 'right',
        ...framePropsStory.args,
    },

    argTypes: {
        variant: {
            control: {
                type: 'radio',
            },
            options: ['primary', 'warning', 'destructive'],
        },
        labelAlignment: {
            control: {
                type: 'radio',
            },
            options: ['left', 'right'],
        },
        ...framePropsStory.argTypes,
    },
};
