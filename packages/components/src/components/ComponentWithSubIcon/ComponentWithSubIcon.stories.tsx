import { type Meta, type StoryObj } from '@storybook/react';

import * as generatedIcons from '@trezor/icons';

import {
    ComponentWithSubIcon as ComponentWithSubIconComponent,
    type ComponentWithSubIconProps,
    allowedComponentWithSubIconFrameProps,
} from './ComponentWithSubIcon';
import { componentWithSubIconIntents } from './types';
import { getFramePropsStory } from '../../utils/frameProps';
import { IconButton } from '../buttons/IconButton/IconButton';

const meta: Meta<typeof ComponentWithSubIconComponent> = {
    title: 'ComponentWithSubIcon',
    component: ComponentWithSubIconComponent,
};
export default meta;

export const ComponentWithSubIcon: StoryObj<ComponentWithSubIconProps> = {
    args: {
        icon: generatedIcons.CheckIcon,
        intent: 'brand',
        children: (
            <IconButton
                icon={generatedIcons.AirTrafficControlIcon}
                size="large"
                intent="neutral"
                priority="secondary"
                tooltip={{ content: 'Air traffic control' }}
            />
        ),
        iconPadding: 2,
        iconOffset: 4,
        iconSize: 8,
        ...getFramePropsStory(allowedComponentWithSubIconFrameProps).args,
    },
    argTypes: {
        icon: {
            options: ['none', ...Object.keys(generatedIcons)],
            mapping: { none: undefined, ...generatedIcons },
            control: { type: 'select' },
        },
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
        iconSize: {
            control: {
                type: 'number',
            },
        },
        ...getFramePropsStory(allowedComponentWithSubIconFrameProps).argTypes,
    },
};
