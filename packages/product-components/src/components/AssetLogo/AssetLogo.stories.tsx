import { type Meta, type StoryObj } from '@storybook/react';

import { getFramePropsStory } from '@trezor/components';

import { AssetLogo as AssetLogoComponent } from './AssetLogo';
import { type AssetLogoProps } from './AssetLogo';
import { allowedAssetLogoFrameProps, allowedAssetLogoSizes } from './AssetLogoWithId';

const NETWORK_SYMBOLS = [
    'btc',
    'eth',
    'pol',
    'bsc',
    'arb',
    'base',
    'op',
    'avax',
    'sol',
    'trx',
    'ada',
    'xrp',
    'ltc',
    'doge',
] as const;

const meta: Meta<AssetLogoProps> = {
    title: 'AssetLogo',
    component: AssetLogoComponent,
    argTypes: {
        ...getFramePropsStory(allowedAssetLogoFrameProps).argTypes,
        size: {
            options: allowedAssetLogoSizes,
            control: { type: 'select' },
        },
        symbol: {
            options: NETWORK_SYMBOLS,
            control: { type: 'select' },
        },
        contractAddress: {
            control: { type: 'text' },
        },
        placeholder: {
            control: { type: 'text' },
        },
        showNetworkIcon: {
            control: { type: 'boolean' },
        },
        shouldTryToFetch: {
            control: { type: 'boolean' },
        },
        isBordered: {
            control: { type: 'boolean' },
        },
    },
};

export default meta;

export const NativeCoin: StoryObj<AssetLogoProps> = {
    args: {
        size: 24,
        symbol: 'eth',
        placeholder: 'ETH',
        shouldTryToFetch: true,
        showNetworkIcon: false,
        isBordered: true,
        ...getFramePropsStory(allowedAssetLogoFrameProps).args,
    },
};

export const Token: StoryObj<AssetLogoProps> = {
    args: {
        size: 24,
        symbol: 'eth',
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on Ethereum
        placeholder: 'USDC',
        shouldTryToFetch: true,
        showNetworkIcon: true,
        isBordered: true,
        ...getFramePropsStory(allowedAssetLogoFrameProps).args,
    },
};
