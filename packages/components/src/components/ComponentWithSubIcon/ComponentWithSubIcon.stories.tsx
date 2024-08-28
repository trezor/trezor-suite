import { Meta, StoryObj } from '@storybook/react';
import { Icon, iconVariants } from '../Icon/Icon';
import {
    allowedComponentWithSubIconFrameProps,
    ComponentWithSubIcon as ComponentWithSubIconComponent,
    ComponentWithSubIconProps,
} from './ComponentWithSubIcon';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta = {
    title: 'ComponentWithSubIcon',
    component: ComponentWithSubIconComponent,
} as Meta;
export default meta;

export const ComponentWithSubIcon: StoryObj<ComponentWithSubIconProps> = {
    args: {
        subIconProps: {
            name: 'check',
        },
        variant: 'destructive',
        children: <Icon name="tor" />,
        ...getFramePropsStory(allowedComponentWithSubIconFrameProps).args,
    },
    argTypes: {
        variant: {
            options: iconVariants,
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedComponentWithSubIconFrameProps).argTypes,
    },
};
