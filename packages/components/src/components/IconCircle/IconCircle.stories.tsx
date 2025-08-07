import React from 'react';

import { Meta, StoryObj } from '@storybook/react';

import {
    IconCircle as IconCircleComponent,
    IconCircleProps,
    allowedIconCircleFrameProps,
} from './IconCircle';
import { iconCirclePaddingTypes, iconCircleVariants } from './types';
import { getFramePropsStory } from '../../utils/frameProps';
import { iconNames } from '../Icon/constants';
import { IconStories } from '../Icon/IconStories';

const meta: Meta = {
    title: 'IconCircle',
} as Meta;
export default meta;

export const IconCircle: StoryObj<IconCircleProps> = {
    render: props => <IconCircleComponent {...(props as IconCircleProps)} />,
    args: {
        variant: 'primary',
        icon: <IconStories name="butterfly" />,
        paddingType: 'large',
        size: 60,
        hasBorder: true,
        ...getFramePropsStory(allowedIconCircleFrameProps).args,
    },
    argTypes: {
        variant: {
            control: {
                type: 'select',
            },
            options: iconCircleVariants,
        },
        size: {
            control: {
                type: 'number',
            },
        },
        paddingType: {
            control: {
                type: 'select',
            },
            options: iconCirclePaddingTypes,
        },
        hasBorder: {
            control: {
                type: 'boolean',
            },
        },
        icon: {
            control: {
                type: 'select',
            },
            // todo: aha, this won't be avaiable :thinking_face:
            options: iconNames,
        },
        ...getFramePropsStory(allowedIconCircleFrameProps).argTypes,
    },
};
