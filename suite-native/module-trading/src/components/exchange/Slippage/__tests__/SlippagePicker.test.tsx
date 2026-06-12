import { getTranslation } from '@suite-native/intl';
import { userEvent, within } from '@suite-native/test-utils';
import { act, renderWithStoreProvider } from '@suite-native/test-utils-store';
import {
    getWalletState,
    mercuryoDexQuote,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';

import { SLIPPAGE_PICKER_TEST_ID, SlippagePicker } from '../SlippagePicker';

const mockShowSheet = jest.fn();
const mockHideSheet = jest.fn();

jest.mock('@suite-native/trading-atoms', () => ({
    ...jest.requireActual('@suite-native/trading-atoms'),
    useBottomSheetControls: () => ({
        isSheetVisible: false,
        showSheet: mockShowSheet,
        hideSheet: mockHideSheet,
    }),
}));

describe('SlippagePicker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderSlippagePicker = async (quote = mercuryoDexQuote) => {
        const result = renderWithStoreProvider(<SlippagePicker quote={quote} />, {
            preloadedState: { wallet: getWalletState() },
        });

        await act(async () => {});

        return result;
    };

    it('should render null when quote is not a DEX trade', async () => {
        const { toJSON } = await renderSlippagePicker(mercuryoFixedWorstQuote);

        expect(toJSON()).toBeNull();
    });

    it('should render "Max. slippage" row', async () => {
        const { getByText, getByTestId } = await renderSlippagePicker();

        expect(
            getByText(getTranslation('moduleTrading.advancedSettings.slippage.maxSlippageLabel')),
        ).toBeOnTheScreen();
        expect(
            within(getByTestId(SLIPPAGE_PICKER_TEST_ID)).getByText(
                `${mercuryoDexQuote.swapSlippage}%`,
            ),
        ).toBeOnTheScreen();
    });

    it('should call showSheet when picker row is pressed', async () => {
        const { getByTestId } = await renderSlippagePicker();

        await userEvent.press(getByTestId(SLIPPAGE_PICKER_TEST_ID));

        expect(mockShowSheet).toHaveBeenCalledTimes(1);
    });
});
