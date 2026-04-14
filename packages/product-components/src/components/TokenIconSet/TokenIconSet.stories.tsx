import { type Meta, type StoryObj } from '@storybook/react';

import { spacingsNew } from '@trezor/theme';

import { TokenIconSet as TokenIconSetComponent, type TokenIconSetProps } from './TokenIconSet';
import { allowedAssetLogoSizes } from '../AssetLogo/AssetLogoWithId';

const getToken = (contract: string, symbol: string, decimals: number) => ({
    contract,
    symbol,
    decimals,
    standard: 'ERC20' as const,
});

const TOKEN_1 = getToken('0xaea46a60368a7bd060eec7df8cba43b7ef41ad85', 'FET', 6);
const TOKEN_2 = getToken('0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', 'AAVE', 6);
const TOKEN_3 = getToken('0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', 'SHIB', 18);
const TOKEN_4 = getToken('0xdAC17F958D2ee523a2206206994597C13D831ec7', 'usdt', 6);

const meta: Meta<typeof TokenIconSetComponent> = {
    title: 'TokenIconSet',
    component: TokenIconSetComponent,
};
export default meta;
export const TokenIconSet: StoryObj<TokenIconSetProps> = {
    args: {
        symbol: 'eth',
        tokens: [TOKEN_1, TOKEN_2, TOKEN_3, TOKEN_4],
        size: 24,
        gap: 16,
        isCountVisible: false,
        isCentered: false,
    },
    argTypes: {
        tokens: {
            options: ['1', '2', '3', '4'],
            mapping: {
                '1': [TOKEN_1],
                '2': [TOKEN_1, TOKEN_2],
                '3': [TOKEN_1, TOKEN_2, TOKEN_3],
                '4': [TOKEN_1, TOKEN_2, TOKEN_3, TOKEN_4],
            },
            control: {
                type: 'select',
                labels: {
                    1: '1 token',
                    2: '2 tokens',
                    3: '3 tokens',
                    4: '4+ tokens',
                },
            },
        },
        size: {
            options: allowedAssetLogoSizes,
            control: {
                type: 'select',
            },
        },
        gap: {
            options: spacingsNew,
            control: {
                type: 'select',
            },
        },
        isCountVisible: {
            control: 'boolean',
        },
        isCentered: {
            control: 'boolean',
        },
    },
};
