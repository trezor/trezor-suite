import { Meta, StoryObj } from '@storybook/react';

import {
    TextButton as TextButtonComponent,
    TextButtonProps,
    allowedTextButtonFrameProps,
    textButtonSizes,
    textButtonVariants,
} from './TextButton';
import { variables } from '../../../config';
import { getFramePropsStory } from '../../../utils/frameProps';
import { iconAlignments } from '../buttonStyleUtils';

const meta: Meta<typeof TextButtonComponent> = {
    title: 'Buttons',
    component: TextButtonComponent,
};
export default meta;

export const TextButton: StoryObj<TextButtonProps> = {
    args: {
        children: 'Button label',
        variant: 'primary',
        iconAlignment: 'start',
        size: 'large',
        isDisabled: false,
        isLoading: false,
        isUnderlined: false,
        ...getFramePropsStory(allowedTextButtonFrameProps).args,
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
            options: textButtonVariants,
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
            options: textButtonSizes,
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
        isUnderlined: {
            control: {
                type: 'boolean',
            },
        },
        title: {
            control: { type: 'text' },
        },
        ...getFramePropsStory(allowedTextButtonFrameProps).argTypes,
    },
};
