import { Meta, StoryObj } from '@storybook/react';

import {
    ComponentWithSubIcon as ComponentWithSubIconComponent,
    ComponentWithSubIconProps,
    allowedComponentWithSubIconFrameProps,
} from './ComponentWithSubIcon';
import { getFramePropsStory } from '../../utils/frameProps';
import { Icon, iconVariants } from '../Icon/Icon';
import { NewButton } from '../buttons/NewButton/NewButton';

const meta: Meta<typeof ComponentWithSubIconComponent> = {
    title: 'ComponentWithSubIcon',
    component: ComponentWithSubIconComponent,
};
export default meta;

export const ComponentWithSubIcon: StoryObj<ComponentWithSubIconProps> = {
    args: {
        icon: <Icon name="check" size="small" />,
        variant: 'destructive',
        children: <NewButton>Use Bitcoin</NewButton>,
        iconPadding: 8,
        iconOffset: 4,
        ...getFramePropsStory(allowedComponentWithSubIconFrameProps).args,
    },
    argTypes: {
        variant: {
            options: iconVariants,
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
