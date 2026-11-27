import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { toTokenAddress } from '@suite-common/tokens';
import {
    type NetworkSymbol,
    asNetworkSymbol,
    networksCollection,
} from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { getFramePropsStory } from '@trezor/components';
import { BigNumber, typedObjectKeys } from '@trezor/utils';

import { AssetItem, type AssetItemProps } from './AssetItem';
import {
    MockAssetItemEnvironment,
    mockAssetItemContract,
    mockAssetItemMissingMetadataContract,
    mockAssetItemSuspiciousContract,
} from '../../mocks/mockAssetItemEnvironment';
import { mockAssetItemStoryServices } from '../../mocks/mockAssetItemStoryServices';

type StoryArgs = Pick<AssetItemProps, 'borderRadius' | 'padding'> & {
    networkSymbol: NetworkSymbol;
    contractAddress?: string;
    cryptoAmount?: string;
    fiatAmount?: string;
    isDisabled?: boolean;
    isDiscreet?: boolean;
    fiatCurrency: 'usd' | 'eur' | 'czk';
};

const contractAddressLabels = {
    '': 'Native asset',
    [mockAssetItemContract]: 'USDC',
    [mockAssetItemSuspiciousContract]: 'Unrecognized token',
    [mockAssetItemMissingMetadataContract]: 'Missing metadata',
};

const meta: Meta<StoryArgs> = {
    title: 'AssetItem',
    args: {
        borderRadius: 10,
        padding: { top: 12, right: 12, bottom: 12, left: 8 },
        networkSymbol: asNetworkSymbol('eth'),
        contractAddress: mockAssetItemContract,
        cryptoAmount: '1250.123456',
        fiatAmount: '1250.12',
        isDisabled: false,
        isDiscreet: false,
        fiatCurrency: 'usd',
    },
    argTypes: {
        ...getFramePropsStory(['borderRadius', 'padding']).argTypes,
        networkSymbol: {
            control: 'select',
            options: networksCollection.map(network => network.symbol),
        },
        contractAddress: {
            control: { type: 'select', labels: contractAddressLabels },
            options: typedObjectKeys(contractAddressLabels),
            if: { arg: 'networkSymbol', eq: 'eth' },
        },
        cryptoAmount: { control: 'text' },
        fiatAmount: { control: 'text' },
        fiatCurrency: { control: 'select', options: ['usd', 'eur', 'czk'] },
    },
    render: ({
        borderRadius,
        padding,
        networkSymbol,
        contractAddress,
        cryptoAmount,
        fiatAmount,
        isDisabled,
        isDiscreet,
        fiatCurrency,
    }) => (
        <MockAssetItemEnvironment
            services={mockAssetItemStoryServices}
            isDiscreet={isDiscreet}
            fiatCurrency={fiatCurrency}
        >
            <AssetItem
                borderRadius={borderRadius}
                padding={padding}
                networkSymbol={networkSymbol}
                contractAddress={
                    networkSymbol === 'eth' && contractAddress
                        ? toTokenAddress(contractAddress)
                        : undefined
                }
                balance={
                    cryptoAmount === undefined
                        ? undefined
                        : {
                              cryptoAmount,
                              fiatAmount:
                                  fiatAmount === undefined
                                      ? null
                                      : asBaseCurrencyAmount(new BigNumber(fiatAmount)),
                          }
                }
                isDisabled={isDisabled}
                onClick={action('onClick')}
            />
        </MockAssetItemEnvironment>
    ),
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {};
