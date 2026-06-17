import { combineReducers } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { selectTradingMaxSlippagePercentage } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { getTranslation, localeReducer } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    type TestStore,
    act,
    createLightStore,
    createStaticReducer,
    userEvent,
} from '@suite-native/test-utils-store';
import { tradingSlice } from '@suite-native/trading-state';
import { TREZOR_TRADING_DEX_SLIPPAGE_URL } from '@trezor/urls';

import { renderWithSlippageTestProvider } from '../../__tests__/testUtils';
import { SlippageBottomSheet } from '../SlippageBottomSheet';

jest.mock('@suite-native/link', () => ({
    useOpenLink: jest.fn(),
}));

const mockUseOpenLink = useOpenLink as jest.MockedFunction<typeof useOpenLink>;
const mockOpenLink = jest.fn();

const mockOnClose = jest.fn();

describe('SlippageBottomSheet', () => {
    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
        }),
    } as const;

    const renderSlippageBottomSheet = async (store: TestStore) => {
        const result = renderWithSlippageTestProvider(
            <SlippageBottomSheet isVisible={false} onClose={mockOnClose} />,
            store,
        );

        await act(() => Promise.resolve());

        return result;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseOpenLink.mockReturnValue(mockOpenLink);
    });

    it('should show default slippage value initially', async () => {
        const store = createLightStore({ reducer });
        const { getByLabelText } = await renderSlippageBottomSheet(store);

        expect(
            getByLabelText(getTranslation('moduleTrading.slippage.inputLabel')),
        ).toHaveDisplayValue('1');
    });

    it('should show preset buttons', async () => {
        const store = createLightStore({ reducer });
        const { getByText } = await renderSlippageBottomSheet(store);

        expect(getByText('0.1%')).toBeOnTheScreen();
        expect(getByText('0.5%')).toBeOnTheScreen();
        expect(getByText('1%')).toBeOnTheScreen();
        expect(getByText('3%')).toBeOnTheScreen();
    });

    it('should update input value when preset button is pressed', async () => {
        const store = createLightStore({ reducer });
        const { getByLabelText, getByText } = await renderSlippageBottomSheet(store);

        await userEvent.press(getByText('3%'));
        await act(() => Promise.resolve());

        expect(
            getByLabelText(getTranslation('moduleTrading.slippage.inputLabel')),
        ).toHaveDisplayValue('3');
    });

    it('should dispatch setMaxSlippagePercentage and call onClose when confirm is pressed', async () => {
        const store = createLightStore({ reducer });
        const { getByText } = await renderSlippageBottomSheet(store);

        await userEvent.press(getByText('3%'));
        await act(() => Promise.resolve());
        await userEvent.press(getByText(getTranslation('generic.buttons.confirm')));

        expect(selectTradingMaxSlippagePercentage(store.getState())).toBe('3');
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not dispatch and call onClose when cancel is pressed', async () => {
        const store = createLightStore({ reducer });
        const { getByText } = await renderSlippageBottomSheet(store);

        await userEvent.press(getByText('3%'));
        await act(() => Promise.resolve());
        await userEvent.press(getByText(getTranslation('generic.buttons.cancel')));

        expect(selectTradingMaxSlippagePercentage(store.getState())).toBe('1');
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should render confirm and cancel buttons', async () => {
        const store = createLightStore({ reducer });
        const { getByText } = await renderSlippageBottomSheet(store);

        expect(getByText(getTranslation('generic.buttons.confirm'))).toBeOnTheScreen();
        expect(getByText(getTranslation('generic.buttons.cancel'))).toBeOnTheScreen();
    });

    it('should open DEX slippage URL when learn more is pressed', async () => {
        const store = createLightStore({ reducer });
        const { getByText } = await renderSlippageBottomSheet(store);

        await userEvent.press(getByText(getTranslation('generic.buttons.learnMore')));

        expect(mockOpenLink).toHaveBeenCalledWith(TREZOR_TRADING_DEX_SLIPPAGE_URL);
    });
});
