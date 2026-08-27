import { selectTradingExchangeSelectedQuoteSwapSlippage } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { type TestStore, act, userEvent } from '@suite-native/test-utils-store';
import { TREZOR_TRADING_DEX_SLIPPAGE_URL } from '@trezor/urls';

import { SlippageBottomSheet } from './SlippageBottomSheet';
import { createSlippageTestStore, renderWithSlippageTestProvider } from '../test-utils/testUtils';

jest.mock('@suite-native/link', () => ({
    useOpenLink: jest.fn(),
}));

const mockUseOpenLink = useOpenLink as jest.MockedFunction<typeof useOpenLink>;
const mockOpenLink = jest.fn();

const mockOnClose = jest.fn();
const mockOnSlippageConfirmed = jest.fn();

describe('SlippageBottomSheet', () => {
    const renderSlippageBottomSheet = async (store: TestStore) => {
        const result = await renderWithSlippageTestProvider(
            <SlippageBottomSheet
                isVisible={false}
                onClose={mockOnClose}
                onSlippageConfirmed={mockOnSlippageConfirmed}
            />,
            { store },
        );

        await act(() => Promise.resolve());

        return result;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseOpenLink.mockReturnValue(mockOpenLink);
    });

    it('should show default slippage value initially', async () => {
        const store = createSlippageTestStore();
        const { getByLabelText } = await renderSlippageBottomSheet(store);

        expect(
            getByLabelText(getTranslation('moduleTrading.slippage.inputLabel')),
        ).toHaveDisplayValue('1');
    });

    it('should show preset buttons', async () => {
        const store = createSlippageTestStore();
        const { getByText } = await renderSlippageBottomSheet(store);

        expect(getByText('0.1%')).toBeOnTheScreen();
        expect(getByText('0.5%')).toBeOnTheScreen();
        expect(getByText('1%')).toBeOnTheScreen();
        expect(getByText('3%')).toBeOnTheScreen();
    });

    it('should update input value when preset button is pressed', async () => {
        const store = createSlippageTestStore();
        const { getByLabelText, getByText } = await renderSlippageBottomSheet(store);

        await userEvent.press(getByText('3%'));
        await act(() => Promise.resolve());

        expect(
            getByLabelText(getTranslation('moduleTrading.slippage.inputLabel')),
        ).toHaveDisplayValue('3');
    });

    it('should update selected quote swapSlippage and call onClose when confirm is pressed', async () => {
        const store = createSlippageTestStore();
        const { getByText } = await renderSlippageBottomSheet(store);

        await userEvent.press(getByText('3%'));
        await act(() => Promise.resolve());
        await userEvent.press(getByText(getTranslation('generic.buttons.confirm')));

        expect(selectTradingExchangeSelectedQuoteSwapSlippage(store.getState())).toBe('3');
        expect(mockOnSlippageConfirmed).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should update slippage before calling onSlippageConfirmed', async () => {
        const store = createSlippageTestStore();
        mockOnSlippageConfirmed.mockImplementation(() => {
            expect(selectTradingExchangeSelectedQuoteSwapSlippage(store.getState())).toBe('3');
        });
        const { getByText } = await renderSlippageBottomSheet(store);

        await userEvent.press(getByText('3%'));
        await act(() => Promise.resolve());
        await userEvent.press(getByText(getTranslation('generic.buttons.confirm')));

        expect(mockOnSlippageConfirmed).toHaveBeenCalledTimes(1);
    });

    it('should not update selected quote swapSlippage and call onClose when cancel is pressed', async () => {
        const store = createSlippageTestStore();
        const { getByText } = await renderSlippageBottomSheet(store);

        await userEvent.press(getByText('3%'));
        await act(() => Promise.resolve());
        await userEvent.press(getByText(getTranslation('generic.buttons.cancel')));

        expect(selectTradingExchangeSelectedQuoteSwapSlippage(store.getState())).toBe('1');
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should render confirm and cancel buttons', async () => {
        const store = createSlippageTestStore();
        const { getByText } = await renderSlippageBottomSheet(store);

        expect(getByText(getTranslation('generic.buttons.confirm'))).toBeOnTheScreen();
        expect(getByText(getTranslation('generic.buttons.cancel'))).toBeOnTheScreen();
    });

    it('should open DEX slippage URL when learn more is pressed', async () => {
        const store = createSlippageTestStore();
        const { getByText } = await renderSlippageBottomSheet(store);

        await userEvent.press(getByText(getTranslation('generic.buttons.learnMore')));

        expect(mockOpenLink).toHaveBeenCalledWith(TREZOR_TRADING_DEX_SLIPPAGE_URL);
    });
});
