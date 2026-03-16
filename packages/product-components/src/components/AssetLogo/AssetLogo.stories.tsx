import { type Meta, type StoryObj } from '@storybook/react';

import { getFramePropsStory } from '@trezor/components';

import {
    AssetLogo as AssetLogoComponent,
    type AssetLogoProps,
    allowedAssetLogoFrameProps,
    allowedAssetLogoSizes,
} from './AssetLogo';

const meta: Meta<AssetLogoProps> = {
    title: 'AssetLogo',
    component: AssetLogoComponent,
};

export default meta;

export const AssetLogo: StoryObj<AssetLogoProps> = {
    args: {
        size: 24,
        coingeckoId: 'ethereum',
        symbol: 'eth',
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        shouldTryToFetch: true,
        placeholder: 'USDC',
        showNetworkIcon: false,
        ...getFramePropsStory(allowedAssetLogoFrameProps).args,
    },
    argTypes: {
        ...getFramePropsStory(allowedAssetLogoFrameProps).argTypes,
        size: {
            options: allowedAssetLogoSizes,
            control: {
                type: 'select',
            },
        },
        showNetworkIcon: {
            control: {
                type: 'boolean',
            },
        },
        shouldTryToFetch: {
            control: {
                type: 'boolean',
            },
        },
    },
};
