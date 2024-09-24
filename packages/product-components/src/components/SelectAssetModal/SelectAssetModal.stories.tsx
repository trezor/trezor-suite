import { Meta, StoryObj } from '@storybook/react';
import { SelectAssetModal as SelectAssetModalComponent, SelectAssetModalProps } from '../../index';
import { ThemeProvider } from 'styled-components';
import { intermediaryTheme, NewModal } from '@trezor/components';
import { action } from '@storybook/addon-actions';

const meta: Meta = {
    title: 'SelectAssetModal',
    component: SelectAssetModalComponent,
    decorators: [
        Story => (
            <ThemeProvider theme={intermediaryTheme.dark}>
                <NewModal.Provider>
                    <Story />
                </NewModal.Provider>
            </ThemeProvider>
        ),
    ],
} as Meta;
export default meta;

export const SelectAssetModal: StoryObj<SelectAssetModalProps> = {
    args: {
        onSelectAssetModal: action('onSelectAssetModal'),
        onFavoriteClick: action('onFavoriteClick'),
    },
    argTypes: {},
};
