import { type Meta, type StoryObj } from '@storybook/react';

import { type Asset, TopAssets } from './TopAssets';

const meta: Meta<typeof TopAssets> = {
    title: 'TopAssets',
    component: TopAssets,
};
export default meta;

const popularAssets: Asset[] = [
    {
        id: 'btc',
        symbol: 'btc',
        networkSymbol: 'btc',
        displaySymbol: 'BTC',
        contractAddress: null,
        coingeckoId: 'bitcoin',
        isNativeToken: true,
    },
    {
        symbol: 'eth',
        networkSymbol: 'eth',
        displaySymbol: 'ETH',
        contractAddress: null,
        coingeckoId: 'ethereum',
        isNativeToken: true,
        id: 'eth',
    },
    {
        symbol: 'sol',
        networkSymbol: 'sol',
        displaySymbol: 'SOL',
        id: 'sol',
        contractAddress: 'WCTk5xWdn5SYg56twGj32sUF3W4WFQ48ogezLBuYTBY',
        coingeckoId: 'solana',
        isNativeToken: false,
    },
    {
        symbol: 'usdc',
        networkSymbol: 'eth',
        displaySymbol: 'USDC',
        contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        coingeckoId: 'ethereum',
        isNativeToken: false,
        id: 'usdc',
    },
    {
        symbol: 'base',
        networkSymbol: 'base',
        displaySymbol: 'BASE',
        id: 'base',
        contractAddress: null,
        coingeckoId: 'ethereum',
        isNativeToken: true,
    },
];

export const Default: StoryObj<typeof TopAssets> = {
    args: {
        assets: popularAssets,
        onAssetClick: asset => {
            console.log(asset);
        },
    },
};
