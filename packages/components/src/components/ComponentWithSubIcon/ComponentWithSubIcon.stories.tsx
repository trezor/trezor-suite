import { Meta, StoryObj } from '@storybook/react';

import {
    ComponentWithSubIcon as ComponentWithSubIconComponent,
    ComponentWithSubIconProps,
    allowedComponentWithSubIconFrameProps,
} from './ComponentWithSubIcon';
import { getFramePropsStory } from '../../utils/frameProps';
import { Icon, iconVariants } from '../Icon/Icon';
import { Button } from '../buttons/Button/Button';

const meta: Meta = {
    title: 'ComponentWithSubIcon',
    component: ComponentWithSubIconComponent,
} as Meta;
export default meta;

export const ComponentWithSubIcon: StoryObj<ComponentWithSubIconProps> = {
    args: {
        icon: <Icon name="check" size="small" />,
        variant: 'destructive',
        children: <Button>Use Bitcoin</Button>,
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
