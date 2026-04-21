import { createRef } from 'react';
import { Linking } from 'react-native';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, userEvent } from '@suite-native/test-utils';
import { TREZOR_SUITE_TOS_URL, TREZOR_SUPPORT_UNDERSTANDING_FEES } from '@trezor/urls';

import { HowTradingWorksSheet } from '../HowTradingWorksSheet';

const mockCloseModal = jest.fn();

describe('HowTradingWorksSheet', () => {
    const mockOpenLink = jest.spyOn(Linking, 'openURL');

    const renderHowTradingWorksSheet = () =>
        renderWithBasicProvider(
            <HowTradingWorksSheet
                ref={createRef<BottomSheetModalMethods>()}
                closeModal={mockCloseModal}
            />,
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should open links on press', async () => {
        const { getByText } = renderHowTradingWorksSheet();

        await userEvent.press(
            getByText(
                getTranslation('moduleTrading.tradingScreen.footer.howTradingWorksSheet.item4'),
            ),
        );
        await userEvent.press(
            getByText(
                getTranslation('moduleTrading.tradingScreen.footer.howTradingWorksSheet.item5'),
            ),
        );

        expect(mockOpenLink).toHaveBeenCalledTimes(2);
        expect(mockOpenLink).toHaveBeenNthCalledWith(1, TREZOR_SUPPORT_UNDERSTANDING_FEES);
        expect(mockOpenLink).toHaveBeenNthCalledWith(2, TREZOR_SUITE_TOS_URL);
    });

    it('should close sheet on got it button press', async () => {
        const { getByText } = renderHowTradingWorksSheet();

        await userEvent.press(getByText(getTranslation('generic.buttons.gotIt')));

        expect(mockCloseModal).toHaveBeenCalledTimes(1);
    });
});
