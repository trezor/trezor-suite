import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import { Checkbox as CheckboxComponent, CheckboxProps } from './Checkbox';

export default {
    title: 'Form/Checkbox',
    component: CheckboxComponent,
} as Meta;

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
    args: { children: 'Checkbox' },
};
