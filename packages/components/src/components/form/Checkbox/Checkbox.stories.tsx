import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import { Checkbox as CheckboxComponent, CheckboxProps } from './Checkbox';

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
            <CheckboxComponent isChecked={isChecked} {...args} onClick={handleIsChecked}>
                {args.children}
            </CheckboxComponent>
        );
    },
    args: { children: 'Checkbox', isDisabled: false, isAlert: false, labelAlignment: 'right' },
    argTypes: {
        labelAlignment: {
            options: ['left', 'right'],
            control: {
                type: 'radio',
            },
        },
        variant: {
            options: ['default', 'indeterminate'],
            control: {
                type: 'radio',
            },
        },
    },
};
