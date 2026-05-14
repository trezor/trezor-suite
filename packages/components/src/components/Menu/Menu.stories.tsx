import { type Meta, type StoryObj } from '@storybook/react';

import { Menu as MenuComponent, type MenuProps, allowedMenuFrameProps } from './Menu';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof MenuComponent> = {
    title: 'Menu',
    component: MenuComponent,
};
export default meta;

export const Menu: StoryObj<MenuProps> = {
    args: {
        items: [
            {
                label: 'Light mode',
                icon: 'sun',
                onClick: () => {},
            },
            {
                label: 'Dark mode',
                icon: 'moon',
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
