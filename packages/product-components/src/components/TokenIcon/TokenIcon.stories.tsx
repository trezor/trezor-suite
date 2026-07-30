import { type Meta, type StoryObj } from '@storybook/react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
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

const ethSymbol = asNetworkSymbol('eth');

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
        symbol: ethSymbol,
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
        symbol: ethSymbol,
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on Ethereum
        placeholder: 'USDC',
        shouldTryToFetch: true,
        showNetworkIcon: true,
        isBordered: true,
        ...getFramePropsStory(allowedTokenIconFrameProps).args,
    },
};
