import { Meta, StoryObj } from '@storybook/react';

import { Menu as MenuComponent, MenuProps, allowedMenuFrameProps } from './Menu';
import { getFramePropsStory } from '../../utils/frameProps';
import { IconStories } from '../Icon/IconStories';

const meta: Meta = {
    title: 'Menu',
    component: MenuComponent,
} as Meta;
export default meta;

export const Menu: StoryObj<MenuProps> = {
    args: {
        items: [
            {
                label: 'Light mode',
                icon: <IconStories name="sun" />,
                onClick: () => {},
            },
            {
                label: 'Dark mode',
                icon: <IconStories name="moon" />,
                onClick: () => {},
            },
        ],
        content: 'Settings',
        onClose: () => {},
        ...getFramePropsStory(allowedMenuFrameProps).args,
    },
    argTypes: {
        ...getFramePropsStory(allowedMenuFrameProps).argTypes,
    },
};
