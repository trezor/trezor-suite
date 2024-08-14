import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import { Switch as SwitchComponent, SwitchProps } from './Switch';

const meta: Meta = {
    title: 'Form',
} as Meta;
export default meta;

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
        isAlert: false,
        isChecked: false,
        isDisabled: false,
        isSmall: false,
        label: 'Headline',
        labelPosition: 'right',
    },
    argTypes: {
        isAlert: {
            control: {
                type: 'boolean',
            },
        },
        isChecked: {
            control: {
                type: 'boolean',
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        isSmall: {
            control: {
                type: 'boolean',
            },
        },
        label: {
            table: {
                type: {
                    summary: 'ReactNode',
                },
            },
        },
        labelPosition: {
            options: ['left', 'right'],
            control: {
                type: 'radio',
            },
        },
    },
};
