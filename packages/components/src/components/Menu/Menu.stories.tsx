import type { Meta, StoryObj } from '@storybook/react';

import type { MenuProps } from './Menu';
import { Menu as MenuComponent, allowedMenuFrameProps } from './Menu';
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
