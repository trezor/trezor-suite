import { IntlProvider } from 'react-intl';

import { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from 'styled-components';
import { action } from '@storybook/addon-actions';

import { intermediaryTheme, NewModal } from '@trezor/components';

import { selectAssetModalOptions } from './SelectAssetModal.storiesData';
import {
    SelectAssetModalProps,
    SelectAssetModal as SelectAssetModalComponent,
    AssetProps,
    ITEM_HEIGHT,
} from './SelectAssetModal';

const meta: Meta = {
    title: 'SelectAssetModal',
    component: SelectAssetModalComponent,
    decorators: [
        Story => (
            <ThemeProvider theme={intermediaryTheme.dark}>
                <NewModal.Provider>
                    <IntlProvider locale="en">
                        <Story />
                    </IntlProvider>
                </NewModal.Provider>
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
            symbolExtended: item.symbolExtended,
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
