import { Meta, StoryObj } from '@storybook/react';
import { TooltipButton as TooltipButtonComponent } from './TooltipButton';
import { getFramePropsStory } from '../../../utils/frameProps';
import { allowedButtonFrameProps } from '../Button/Button';
import { variables } from '../../../config';
import { buttonSizes, buttonVariants } from '../buttonStyleUtils';

const meta: Meta = {
    title: 'Buttons',
    component: TooltipButtonComponent,
} as Meta;
export default meta;

export const TooltipButton: StoryObj<typeof TooltipButtonComponent> = {
    args: {
        children: 'Button',
        variant: 'primary',
        size: 'medium',
        isDisabled: true,
        isLoading: false,
        isFullWidth: false,
        iconAlignment: 'left',
        title: 'Button title',
        tooltipContent: 'Example tooltip',
        ...getFramePropsStory(allowedButtonFrameProps).args,
    },
    argTypes: {
        children: {
            table: {
                type: {
                    summary: 'ReactNode',
                },
            },
        },
        variant: {
            control: {
                type: 'radio',
            },
            options: buttonVariants,
        },
        size: {
            control: {
                type: 'radio',
            },
            options: buttonSizes,
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        isLoading: {
            control: {
                type: 'boolean',
            },
        },
        isFullWidth: {
            control: {
                type: 'boolean',
            },
        },
        icon: {
            options: {
                'No icon': null,
                ...variables.ICONS.reduce((acc, icon) => ({ ...acc, [icon]: icon }), {}),
            },
            control: {
                type: 'select',
            },
        },
        iconSize: {
            control: {
                type: 'number',
            },
        },
        iconAlignment: {
            control: {
                type: 'radio',
            },
            options: ['left', 'right'],
        },
        title: {
            control: { type: 'text' },
        },
        tooltipContent: {
            table: {
                type: {
                    summary: 'ReactNode',
                },
            },
        },
        ...getFramePropsStory(allowedButtonFrameProps).argTypes,
    },
};
