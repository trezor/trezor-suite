import { type Meta, type StoryObj } from '@storybook/react';

import { getFramePropsStory } from '@trezor/components';

import { TokenIcon as TokenIconComponent } from './TokenIcon';
import {
    type TokenIconProps,
    allowedTokenIconFrameProps,
    allowedTokenIconSizes,
} from './tokenIconTypes';

const NETWORK_SYMBOLS = [
    'btc',
    'eth',
    'pol',
    'bsc',
    'arb',
    'base',
    'op',
    'avax',
    'rhc',
    'hype',
    'sol',
    'trx',
    'ada',
    'xrp',
    'ltc',
    'doge',
] as const;

const meta: Meta<TokenIconProps> = {
    title: 'TokenIcon',
    component: TokenIconComponent,
    argTypes: {
        ...getFramePropsStory(allowedTokenIconFrameProps).argTypes,
        symbol: {
            options: NETWORK_SYMBOLS,
            control: { type: 'select' },
        },
        contractAddress: {
            control: { type: 'text' },
        },
        size: {
            options: allowedTokenIconSizes,
            control: { type: 'select' },
        },
        showNetworkIcon: {
            control: { type: 'boolean' },
        },
        showNativeNetworkBadge: {
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
        symbol: 'eth',
        placeholder: 'ETH',
        shouldTryToFetch: true,
        showNetworkIcon: false,
        isBordered: true,
        ...getFramePropsStory(allowedTokenIconFrameProps).args,
    },
};

export const Token: StoryObj<TokenIconProps> = {
    args: {
        size: 24,
        symbol: 'eth',
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on Ethereum
        placeholder: 'USDC',
        shouldTryToFetch: true,
        showNetworkIcon: true,
        isBordered: true,
        ...getFramePropsStory(allowedTokenIconFrameProps).args,
    },
};

export const NativeCoinWithNetworkBadge: StoryObj<TokenIconProps> = {
    args: {
        size: 40,
        symbol: 'eth',
        placeholder: 'ETH',
        shouldTryToFetch: true,
        showNetworkIcon: true,
        showNativeNetworkBadge: true,
        isBordered: true,
        ...getFramePropsStory(allowedTokenIconFrameProps).args,
    },
};

export const NativeCoinWithoutNetworkBadge: StoryObj<TokenIconProps> = {
    args: {
        size: 40,
        symbol: 'btc',
        placeholder: 'BTC',
        shouldTryToFetch: true,
        showNetworkIcon: true,
        showNativeNetworkBadge: true,
        isBordered: true,
        ...getFramePropsStory(allowedTokenIconFrameProps).args,
    },
};

export const NativeCoinLegacyNoBadge: StoryObj<TokenIconProps> = {
    args: {
        size: 40,
        symbol: 'eth',
        placeholder: 'ETH',
        shouldTryToFetch: true,
        showNetworkIcon: true,
        showNativeNetworkBadge: false,
        isBordered: true,
        ...getFramePropsStory(allowedTokenIconFrameProps).args,
    },
};
