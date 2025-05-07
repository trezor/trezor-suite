import { Meta, StoryObj } from '@storybook/react';

import { Menu as MenuComponent, MenuProps } from './Menu';

const meta: Meta = {
    title: 'Menu',
    component: MenuComponent,
} as Meta;
export default meta;

export const Menu: StoryObj<MenuProps> = {
    render: () => (
        <MenuComponent
            items={[
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
            ]}
            content={<div>Settings</div>}
            onClose={() => {}}
        />
    ),
};
