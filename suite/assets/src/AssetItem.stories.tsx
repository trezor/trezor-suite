import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { asAmountUnit } from '@suite-common/wallet-utils';
import { Box } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { AssetItem } from './AssetItem';
import {
    MockAssetItemEnvironment,
    mockAssetItemContract,
    mockAssetItemSuspiciousContract,
} from '../mocks/mockAssetItemEnvironment';

type StoryArgs = {
    networkSymbol: string;
    contractAddress?: string;
    cryptoAmount?: string;
    fiatAmount?: string;
    isDisabled?: boolean;
    isDiscreet?: boolean;
    useSats?: boolean;
    locale: string;
    fiatCurrency: 'usd' | 'eur' | 'czk';
    width: number;
};

const meta: Meta<StoryArgs> = {
    title: 'AssetItem',
    args: {
        networkSymbol: 'btc',
        cryptoAmount: '1.25',
        fiatAmount: '125000',
        isDisabled: false,
        isDiscreet: false,
        useSats: false,
        locale: 'en',
        fiatCurrency: 'usd',
        width: 520,
    },
    argTypes: {
        networkSymbol: { control: 'select', options: ['btc', 'eth', 'base', 'bsc', 'sol', 'test'] },
        contractAddress: { control: 'text' },
        cryptoAmount: { control: 'text' },
        fiatAmount: { control: 'text' },
        fiatCurrency: { control: 'select', options: ['usd', 'eur', 'czk'] },
        width: { control: { type: 'range', min: 240, max: 800, step: 10 } },
    },
    render: ({
        networkSymbol,
        contractAddress,
        cryptoAmount,
        fiatAmount,
        isDisabled,
        isDiscreet,
        useSats,
        locale,
        fiatCurrency,
        width,
    }) => (
        <MockAssetItemEnvironment
            isDiscreet={isDiscreet}
            useSats={useSats}
            locale={locale}
            fiatCurrency={fiatCurrency}
        >
            <Box width={width} maxWidth="100%">
                <AssetItem
                    assetId={{
                        networkSymbol: asNetworkSymbol(networkSymbol),
                        contractAddress: contractAddress
                            ? toTokenAddress(contractAddress)
                            : undefined,
                    }}
                    cryptoAmount={
                        cryptoAmount === undefined
                            ? undefined
                            : asAmountUnit(new BigNumber(cryptoAmount))
                    }
                    fiatAmount={
                        fiatAmount === undefined
                            ? undefined
                            : asBaseCurrencyAmount(new BigNumber(fiatAmount))
                    }
                    isDisabled={isDisabled}
                    onClick={action('onClick')}
                />
            </Box>
        </MockAssetItemEnvironment>
    ),
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Native: Story = {};
export const Token: Story = {
    args: {
        networkSymbol: 'eth',
        contractAddress: mockAssetItemContract,
        cryptoAmount: '1250.123456',
        fiatAmount: '1250.12',
    },
};
export const LayerTwo: Story = {
    args: { networkSymbol: 'base', cryptoAmount: '0.5', fiatAmount: '1500' },
};
export const Bnb: Story = { args: { networkSymbol: 'bsc', cryptoAmount: '1', fiatAmount: '600' } };
export const WithoutFiat: Story = { args: { fiatAmount: undefined } };
export const WithoutHoldings: Story = { args: { fiatAmount: undefined, cryptoAmount: undefined } };
export const Zero: Story = { args: { fiatAmount: '0', cryptoAmount: '0' } };
export const Disabled: Story = { args: { isDisabled: true } };
export const UnrecognizedToken: Story = {
    args: {
        networkSymbol: 'eth',
        contractAddress: mockAssetItemSuspiciousContract,
        cryptoAmount: '500',
        fiatAmount: undefined,
    },
};
export const MissingMetadata: Story = {
    args: {
        networkSymbol: 'eth',
        contractAddress: '0x0000000000000000000000000000000000000003',
        fiatAmount: undefined,
    },
};
export const Narrow: Story = {
    args: {
        networkSymbol: 'eth',
        contractAddress: mockAssetItemSuspiciousContract,
        width: 280,
        fiatAmount: undefined,
    },
};
export const Discreet: Story = { args: { isDiscreet: true } };
export const Satoshis: Story = { args: { useSats: true, cryptoAmount: '0.000001' } };
export const Localized: Story = {
    args: { locale: 'cs', fiatCurrency: 'czk', fiatAmount: '123456.78' },
};
