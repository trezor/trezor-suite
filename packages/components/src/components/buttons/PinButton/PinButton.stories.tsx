import { Meta, StoryObj } from '@storybook/react';

import { PinButton as PinButtonComponent } from './PinButton';

const meta: Meta<typeof PinButtonComponent> = {
    title: '🫵 Buttons',
    component: PinButtonComponent,
};
export default meta;

export const PinButton: StoryObj<typeof meta> = {
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
