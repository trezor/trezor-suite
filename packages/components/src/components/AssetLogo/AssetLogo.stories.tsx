import { Meta, StoryObj } from '@storybook/react';
import {
    allowedAssetLogoFrameProps,
    allowedAssetLogoSizes,
    AssetLogo as AssetLogoComponent,
    AssetLogoProps,
} from './AssetLogo';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<AssetLogoProps> = {
    title: 'AssetLogo',
    component: AssetLogoComponent,
};

export default meta;

export const AssetLogo: StoryObj<AssetLogoProps> = {
    args: {
        size: 24,
        coingeckoId: 'binance-smart-chain',
        contractAddress: '0x0203d275d2a65030889af45ed91d472be3948b92',
        shouldTryToFetch: true,
        placeholder: 'CATWIFHAT',
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
