import { Meta, StoryObj } from '@storybook/react';

import {
    ComponentWithSubIcon as ComponentWithSubIconComponent,
    ComponentWithSubIconProps,
    allowedComponentWithSubIconFrameProps,
} from './ComponentWithSubIcon';
import { getFramePropsStory } from '../../utils/frameProps';
import { iconVariants } from '../Icon/Icon';
import { IconStories } from '../Icon/IconStories';

const meta: Meta = {
    title: 'ComponentWithSubIcon',
    component: ComponentWithSubIconComponent,
} as Meta;
export default meta;

export const ComponentWithSubIcon: StoryObj<ComponentWithSubIconProps> = {
    args: {
        subIcon: <IconStories name="check" />,
        variant: 'destructive',
        children: <IconStories name="torBrowser" />,
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
