import React from 'react';

import { type Meta, type StoryObj } from '@storybook/react';

import * as generatedIcons from '@trezor/icons';

import { IconCircle as IconCircleComponent, allowedIconCircleFrameProps } from './IconCircle';
import { iconCircleIntents, iconCircleSizes } from './types';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof IconCircleComponent> = {
    title: 'IconCircle',
};
export default meta;

export const IconCircle: StoryObj<typeof meta> = {
    render: props => <IconCircleComponent {...props} />,
    args: {
        intent: 'brand',
        icon: generatedIcons.ButterflyIcon,
        size: 40,
        ...getFramePropsStory(allowedIconCircleFrameProps).args,
    },
    argTypes: {
        icon: {
            options: Object.keys(generatedIcons),
            mapping: generatedIcons,
            control: { type: 'select' },
        },
        intent: {
            control: {
                type: 'select',
            },
            options: iconCircleIntents,
        },
        size: {
            control: {
                type: 'select',
            },
            options: iconCircleSizes,
        },
        ...getFramePropsStory(allowedIconCircleFrameProps).argTypes,
    },
};
