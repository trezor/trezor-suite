import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import { Switch as SwitchComponent, SwitchProps } from './Switch';

export default {
    title: 'Form/Switch',
} as Meta;

export const Switch: StoryObj<SwitchProps> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ isChecked }, updateArgs] = useArgs();
        const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

        return (
            <SwitchComponent
                onChange={handleIsChecked}
                isChecked={isChecked}
                isSmall={args.isSmall}
                isDisabled={args.isDisabled}
                label={args.label}
                labelPosition={args.labelPosition}
                isAlert={args.isAlert}
            />
        );
    },
    args: {
        isSmall: false,
        isDisabled: false,
        isChecked: false,
        label: 'Headline',
        labelPosition: 'right',
        isAlert: false,
    },
    argTypes: {
        labelPosition: {
            options: ['left', 'right'],
            control: {
                type: 'radio',
            },
        },
    },
};
