import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { variables } from '@trezor/components';

import { SidebarBanner as SidebarBannerComponent } from './SidebarBanner';

const meta: Meta<typeof SidebarBannerComponent> = {
    title: 'SidebarBanner',
    component: SidebarBannerComponent,
};

export default meta;

export const SidebarBanner: StoryObj<typeof SidebarBannerComponent> = {
    args: {
        ctaLabel: 'Learn more',
        closeLabel: 'Dismiss',
        description: 'Your labels stay secure and in sync across your devices.',
        heading: 'Turn on Suite Sync',
        icon: 'arrowsClockwise',
        onClick: action('onClick'),
        onClose: action('onClose'),
    },
    argTypes: {
        icon: {
            control: 'select',
            options: variables.ICONS,
        },
    },
};
