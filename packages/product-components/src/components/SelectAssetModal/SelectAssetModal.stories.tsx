import { Meta, StoryObj } from '@storybook/react';
import { SelectAssetModal as SelectAssetModalComponent, SelectAssetModalProps } from '../../index';
import { ThemeProvider } from 'styled-components';
import { intermediaryTheme, NewModal } from '@trezor/components';
import { action } from '@storybook/addon-actions';
import { IntlProvider } from 'react-intl';
import { selectAssetModalOptions, selectAssetModalNetworks } from './mockData';

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

export const SelectAssetModal: StoryObj<SelectAssetModalProps> = {
    args: {
        onSelectAssetModal: action('onSelectAssetModal'),
        // onFavoriteClick: undefined,
        onClose: action('onClose'),
        options: selectAssetModalOptions,
        networkCategories: selectAssetModalNetworks,
    },
    argTypes: {},
};
