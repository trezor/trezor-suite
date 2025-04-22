import { IntlProvider } from 'react-intl';

import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from 'styled-components';

import { Modal, intermediaryTheme } from '@trezor/components';

import {
    AssetProps,
    ITEM_HEIGHT,
    SelectAssetModal as SelectAssetModalComponent,
    SelectAssetModalProps,
} from './SelectAssetModal';
import { selectAssetModalOptions } from './SelectAssetModal.storiesData';

const meta: Meta = {
    title: 'SelectAssetModal',
    component: SelectAssetModalComponent,
    decorators: [
        Story => (
            <ThemeProvider theme={intermediaryTheme.dark}>
                <Modal.Provider>
                    <IntlProvider locale="en">
                        <Story />
                    </IntlProvider>
                </Modal.Provider>
            </ThemeProvider>
        ),
    ],
} as Meta;
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

export const SelectAssetModal: StoryObj<SelectAssetModalProps> = {
    args: {
        onSelectAsset: action('onSelectAsset'),
        onClose: action('onClose'),
        options: getData(selectAssetModalOptions),
    },
    argTypes: {},
};
