import { type Meta, type StoryObj } from '@storybook/react';

import { getFramePropsStory } from '@trezor/components';

import { TokenIcon as TokenIconComponent } from './TokenIcon';
import { exampleBadge, exampleIcon } from './storyFixtures';
import {
    type TokenIconProps,
    allowedTokenIconFrameProps,
    allowedTokenIconSizes,
} from './tokenIconTypes';

const meta: Meta<TokenIconProps> = {
    title: 'TokenIcon',
    component: TokenIconComponent,
    argTypes: {
        ...getFramePropsStory(allowedTokenIconFrameProps).argTypes,
        sources: {
            control: { type: 'object' },
        },
        size: {
            options: allowedTokenIconSizes,
            control: { type: 'select' },
        },
        badge: {
            control: { type: 'boolean' },
        },
        shouldTryToFetch: {
            control: { type: 'boolean' },
        },
        placeholder: {
            control: { type: 'text' },
        },
        placeholderWithTooltip: {
            control: { type: 'boolean' },
        },
        isBordered: {
            control: { type: 'boolean' },
        },
    },
};

export default meta;

export const NativeCoin: StoryObj<TokenIconProps> = {
    args: {
        size: 24,
        src: exampleIcon,
        placeholder: 'ETH',
        shouldTryToFetch: true,
        isBordered: true,
        ...getFramePropsStory(allowedTokenIconFrameProps).args,
    },
};

export const Token: StoryObj<TokenIconProps> = {
    args: {
        size: 24,
        src: exampleIcon,
        sources: [{ src: exampleIcon }],
        placeholder: 'USDC',
        shouldTryToFetch: true,
        badge: exampleBadge,
        isBordered: true,
        ...getFramePropsStory(allowedTokenIconFrameProps).args,
    },
};
