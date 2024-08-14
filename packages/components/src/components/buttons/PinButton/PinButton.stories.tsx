import { Meta, StoryObj } from '@storybook/react';
import { PinButton as PinButtonComponent } from './PinButton';

const meta: Meta = {
    title: 'Buttons',
    component: PinButtonComponent,
} as Meta;
export default meta;

export const PinButton: StoryObj<typeof PinButtonComponent> = {
    args: {
        'data-value': '1',
    },
    argTypes: {
        'data-value': {
            control: {
                type: 'text',
            },
        },
        onClick: {
            table: {
                type: {
                    summary: 'MouseEventHandler<HTMLButtonElement> | undefined',
                },
            },
        },
    },
};
