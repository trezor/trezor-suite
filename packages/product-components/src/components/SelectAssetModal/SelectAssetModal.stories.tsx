import { IntlProvider } from 'react-intl';

import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import { ThemeProvider } from 'styled-components';

import { Modal, intermediaryTheme } from '@trezor/components';

import { ITEM_HEIGHT, SelectAssetModal as SelectAssetModalComponent } from './SelectAssetModal';
import { selectAssetModalOptions } from './SelectAssetModal.storiesData';
import { type AssetProps } from './types';

const meta = {
    title: 'SelectAssetModal',
    component: SelectAssetModalComponent,
    decorators: [
        Story => (
            <ThemeProvider theme={{ variant: 'dark', ...intermediaryTheme.dark }}>
                <Modal.Provider>
                    <IntlProvider locale="en">
                        <Story />
                    </IntlProvider>
                </Modal.Provider>
            </ThemeProvider>
        ),
    ],
} satisfies Meta<typeof SelectAssetModalComponent>;

export default meta;

const getData = (options: typeof selectAssetModalOptions): AssetProps[] =>
    options
        .filter(item => item.type === 'currency')
        .map(item => ({
            ticker: item.label ?? item.ticker,
            symbol: item.symbol,
            cryptoName: item.cryptoName ?? item.ticker,
            badge: item.badge ?? item.networkName,
            coingeckoId: item.coingeckoId,
            contractAddress: item.contractAddress,
            height: ITEM_HEIGHT,
        }));

export const SelectAssetModal: StoryObj<typeof meta> = {
    args: {
        onSelectAsset: action('onSelectAsset'),
        onClose: action('onClose'),
        options: getData(selectAssetModalOptions),
        renderOptionBalance: () => null,
        noItemsAvailablePlaceholder: {
            heading: 'No items available',
            body: 'No items available',
        },
    },
    argTypes: {},
};
