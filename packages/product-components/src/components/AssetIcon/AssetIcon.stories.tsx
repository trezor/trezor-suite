import { type Meta, type StoryObj } from '@storybook/react';

import { getFramePropsStory } from '@trezor/components';

import { AssetIcon as AssetIconComponent, type AssetIconProps } from './AssetIcon';
import { allowedAssetLogoFrameProps, allowedAssetLogoSizes } from '../AssetLogo/AssetLogoWithId';

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

const meta: Meta<AssetIconProps> = {
    title: 'AssetIcon',
    component: AssetIconComponent,
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
        shouldTryToFetch: {
            control: { type: 'boolean' },
        },
        isBordered: {
            control: { type: 'boolean' },
        },
    },
};

export default meta;

export const NativeSingleAsset: StoryObj<AssetIconProps> = {
    args: {
        size: 40,
        symbol: 'btc',
        placeholder: 'BTC',
        ...getFramePropsStory(allowedAssetLogoFrameProps).args,
    },
};

export const NativeTokenNetwork: StoryObj<AssetIconProps> = {
    args: {
        size: 40,
        symbol: 'eth',
        placeholder: 'ETH',
        ...getFramePropsStory(allowedAssetLogoFrameProps).args,
    },
};

export const Token: StoryObj<AssetIconProps> = {
    args: {
        size: 40,
        symbol: 'eth',
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on Ethereum
        placeholder: 'USDC',
        shouldTryToFetch: true,
        ...getFramePropsStory(allowedAssetLogoFrameProps).args,
    },
};

export const SmallNoBadge: StoryObj<AssetIconProps> = {
    args: {
        size: 20,
        symbol: 'eth',
        placeholder: 'ETH',
        ...getFramePropsStory(allowedAssetLogoFrameProps).args,
    },
};

export const UnknownSymbolFallback: StoryObj<AssetIconProps> = {
    args: {
        size: 40,
        symbol: 'eth',
        contractAddress: '0x0000000000000000000000000000000000000001',
        placeholder: 'XYZ',
        shouldTryToFetch: false,
        ...getFramePropsStory(allowedAssetLogoFrameProps).args,
    },
};
