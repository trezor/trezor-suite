import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { Box } from '@trezor/components';
import * as generatedIcons from '@trezor/icons';

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
        icon: generatedIcons.ArrowsClockwiseIcon,
        onClick: action('onClick'),
        onClose: action('onClose'),
    },
    argTypes: {
        icon: {
            control: { type: 'select' },
            options: Object.keys(generatedIcons),
            mapping: generatedIcons,
        },
    },
};

export const SidebarBannerWithHref: StoryObj<typeof SidebarBannerComponent> = {
    args: {
        ctaHref: 'https://trezor.io/store',
        ctaLabel: 'Get Trezor',
        closeLabel: 'Dismiss',
        description: 'It is the safest way to secure your crypto.',
        heading: "Don't have a Trezor yet?",
        icon: generatedIcons.StorefrontIcon,
        intent: 'neutral',
        onClose: action('onClose'),
    },
    argTypes: {
        icon: {
            control: { type: 'select' },
            options: Object.keys(generatedIcons),
            mapping: generatedIcons,
        },
    },
};

export const SidebarBannerWithHeroContent: StoryObj<typeof SidebarBannerComponent> = {
    args: {
        ctaLabel: 'Learn more',
        description: 'Your labels stay secure and in sync across your devices.',
        heading: 'Turn on Suite Sync',
        heroContent: <Box backgroundColor="elementFillBrandSofter" height={80} width="100%" />,
        onClick: action('onClick'),
    },
};
