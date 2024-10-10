import { Meta, StoryObj } from '@storybook/react';
import { TokenIconSet as TokenIconSetComponent, TokenIconSetProps } from './TokenIconSet';

const getToken = (contract: string, symbol: string, decimals: number) => ({
    contract,
    symbol,
    decimals,
    type: 'ERC20',
});

const TOKEN_1 = getToken('0xaea46a60368a7bd060eec7df8cba43b7ef41ad85', 'FET', 6);
const TOKEN_2 = getToken('0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', 'AAVE', 6);
const TOKEN_3 = getToken('0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', 'SHIB', 18);
const TOKEN_4 = getToken('0xdAC17F958D2ee523a2206206994597C13D831ec7', 'usdt', 6);

const meta: Meta = {
    title: 'TokenIconSet',
} as Meta;
export default meta;
export const TokenIconSet: StoryObj<TokenIconSetProps> = {
    render: (props: TokenIconSetProps) => <TokenIconSetComponent {...props} />,
    args: {
        network: 'eth',
        tokens: [TOKEN_1, TOKEN_2, TOKEN_3, TOKEN_4],
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
    },
};
