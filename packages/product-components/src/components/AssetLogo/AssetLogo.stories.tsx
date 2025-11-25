import { Meta, StoryObj } from '@storybook/react';

import { getFramePropsStory } from '@trezor/components';

import {
    AssetLogo as AssetLogoComponent,
    AssetLogoProps,
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
        ...getFramePropsStory(allowedAssetLogoFrameProps).args,
    },
    argTypes: {
        size: {
            options: allowedAssetLogoSizes,
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedAssetLogoFrameProps).argTypes,
    },
};
