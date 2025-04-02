import { Meta, StoryObj } from '@storybook/react';

import { TextButton as TextButtonComponent, TextButtonProps } from './TextButton';
import { variables } from '../../../config';
import { getFramePropsStory } from '../../../utils/frameProps';
import { allowedButtonFrameProps } from '../Button/Button';
import { buttonSizes, buttonVariants, iconAlignments } from '../buttonStyleUtils';

const meta: Meta = {
    title: 'Buttons',
    component: TextButtonComponent,
} as Meta;
export default meta;

export const TextButton: StoryObj<TextButtonProps> = {
    args: {
        children: 'Button label',
        variant: 'primary',
        iconAlignment: 'start',
        size: 'large',
        isDisabled: false,
        isLoading: false,
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
        icon: {
            options: [null, ...variables.ICONS],
            control: {
                type: 'select',
                labels: {
                    'No icon': null,
                    ...variables.ICONS.reduce((acc, icon) => ({ ...acc, [icon]: icon }), {}),
                },
            },
        },
        iconAlignment: {
            control: {
                type: 'radio',
            },
            options: iconAlignments,
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
        title: {
            control: { type: 'text' },
        },
        ...getFramePropsStory(allowedButtonFrameProps).argTypes,
    },
};
