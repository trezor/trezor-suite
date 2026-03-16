import { type Meta, type StoryObj } from '@storybook/react';

import {
    ComponentWithSubIcon as ComponentWithSubIconComponent,
    type ComponentWithSubIconProps,
    allowedComponentWithSubIconFrameProps,
} from './ComponentWithSubIcon';
import { componentWithSubIconIntents } from './types';
import { variables } from '../../config';
import { getFramePropsStory } from '../../utils/frameProps';
import { IconButton } from '../buttons/IconButton/IconButton';

const meta: Meta<typeof ComponentWithSubIconComponent> = {
    title: 'ComponentWithSubIcon',
    component: ComponentWithSubIconComponent,
};
export default meta;

export const ComponentWithSubIcon: StoryObj<ComponentWithSubIconProps> = {
    args: {
        iconName: 'check',
        intent: 'brand',
        children: (
            <IconButton
                icon="airTrafficControl"
                size="large"
                intent="neutral"
                priority="secondary"
            />
        ),
        iconPadding: 2,
        iconOffset: 4,
        iconSize: 8,
        ...getFramePropsStory(allowedComponentWithSubIconFrameProps).args,
    },
    argTypes: {
        intent: {
            options: componentWithSubIconIntents,
            control: {
                type: 'select',
            },
        },
        iconPadding: {
            control: {
                type: 'number',
            },
        },
        iconOffset: {
            control: {
                type: 'number',
            },
        },
        iconName: {
            options: [null, ...variables.ICONS],
            control: {
                type: 'select',
            },
        },
        iconSize: {
            control: {
                type: 'number',
            },
        },
        ...getFramePropsStory(allowedComponentWithSubIconFrameProps).argTypes,
    },
};
