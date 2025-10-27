import { Meta, StoryObj } from '@storybook/react';

import { type CardButtonProps } from './CardButton';
import { CardButton as CardButtonComponent } from '../../index';

const meta: Meta<typeof CardButtonComponent> = {
    title: 'CardButton',
    component: CardButtonComponent,
};
export default meta;

export const CardButton: StoryObj<CardButtonProps> = {
    args: {
        children: 'hello',
        onClick: () => null,
        isDisabled: false,
    },
    argTypes: {
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
    },
};
