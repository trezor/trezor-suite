import { Meta, StoryObj } from '@storybook/react';
import { PinButton as PinButtonComponent } from './PinButton';

const meta: Meta = {
    title: 'Buttons/PinButton',
    component: PinButtonComponent,
} as Meta;
export default meta;

export const PinButton: StoryObj<typeof PinButtonComponent> = {};
