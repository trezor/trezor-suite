import { Meta, StoryObj } from '@storybook/react';

import {
    ComponentWithSubIcon as ComponentWithSubIconComponent,
    ComponentWithSubIconProps,
    allowedComponentWithSubIconFrameProps,
} from './ComponentWithSubIcon';
import { getFramePropsStory } from '../../utils/frameProps';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../buttons/IconButton/IconButton';
import { buttonIntents } from '../buttons/types';

const meta: Meta<typeof ComponentWithSubIconComponent> = {
    title: 'ComponentWithSubIcon',
    component: ComponentWithSubIconComponent,
};
export default meta;

export const ComponentWithSubIcon: StoryObj<ComponentWithSubIconProps> = {
    args: {
        icon: <Icon name="check" size={8} />,
        intent: 'brand',
        children: (
            <IconButton
                icon="airTrafficControl"
                size="large"
                intent="neutral"
                priority="secondary"
            />
        ),
        iconPadding: 4,
        iconOffset: 4,
        ...getFramePropsStory(allowedComponentWithSubIconFrameProps).args,
    },
    argTypes: {
        intent: {
            options: buttonIntents,
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
        ...getFramePropsStory(allowedComponentWithSubIconFrameProps).argTypes,
    },
};
