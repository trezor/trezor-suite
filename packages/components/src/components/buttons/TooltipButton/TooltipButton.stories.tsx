import { Meta, StoryObj } from '@storybook/react';
import { TooltipButton as TooltipButtonComponent } from './TooltipButton';

const meta: Meta = {
    title: 'Buttons/TooltipButton',
    component: TooltipButtonComponent,
} as Meta;
export default meta;

export const TooltipButton: StoryObj<typeof TooltipButtonComponent> = {
    args: {
        children: 'Button',
        isDisabled: true,
        tooltipContent: 'Example tooltip',
    },
};
