import React from 'react';

import { Meta, StoryObj } from '@storybook/react';

// TODO: suite-common imports in non-suite packages should not be allowed
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { IconName, icons } from '@suite-common/icons/src/icons';

import {
    IconCircle as IconCircleComponent,
    IconCircleProps,
    allowedIconCircleFrameProps,
} from './IconCircle';
import { iconCircleIntents, iconCircleSizes } from './types';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof IconCircleComponent> = {
    title: 'IconCircle',
};
export default meta;

export const IconCircle: StoryObj<typeof meta> = {
    render: props => <IconCircleComponent {...(props as IconCircleProps)} />,
    args: {
        intent: 'brand',
        name: 'butterfly',
        size: 40,
        ...getFramePropsStory(allowedIconCircleFrameProps).args,
    },
    argTypes: {
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
        name: {
            control: {
                type: 'select',
            },
            options: Object.keys(icons) as IconName[],
        },
        ...getFramePropsStory(allowedIconCircleFrameProps).argTypes,
    },
};
