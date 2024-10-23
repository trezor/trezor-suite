import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { icons, IconName } from '@suite-common/icons/src/icons';

import {
    IconCircle as IconCircleComponent,
    IconCircleProps,
    allowedIconCircleFrameProps,
} from './IconCircle';
import { iconCircleVariants } from './types';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta = {
    title: 'IconCircle',
} as Meta;
export default meta;

export const IconCircle: StoryObj = {
    render: props => <IconCircleComponent {...(props as IconCircleProps)} />,
    args: {
        variant: 'primary',
        name: 'butterfly',
        size: 40,
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
        hasBorder: {
            control: {
                type: 'boolean',
            },
        },
        name: {
            control: {
                type: 'select',
            },
            options: Object.keys(icons) as IconName[],
        },
        ...getFramePropsStory(allowedIconCircleFrameProps).argTypes,
    },
};
