import { Linking } from 'react-native';

import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils-store';
import { exchangeCexdirect } from '@suite-native/trading-fixtures';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { Footer } from '../Footer';

const mockOpenModal = jest.fn();
const mockCloseModal = jest.fn();

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetModal: () => ({
        bottomSheetRef: { current: null },
        openModal: mockOpenModal,
        closeModal: mockCloseModal,
    }),
}));

describe('Footer', () => {
    const mockOpenLink = jest.spyOn(Linking, 'openURL');

    const renderFooter = (overrides: PreloadedStatePartial<TradingTestPreloadedState> = {}) =>
        renderWithTradingProvider(<Footer />, { overrides });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render footer info', () => {
        const { getByText } = renderFooter({});

        expect(
            getByText(
                getTranslation('moduleTrading.tradingScreen.footer.termsAndConditionsGeneric'),
            ),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation('moduleTrading.tradingScreen.footer.howTradingWorksSheet.title'),
            ),
        ).toBeOnTheScreen();
    });

    it('should render nothing when isAmountInputActive is true', () => {
        const { toJSON } = renderFooter({
            wallet: { trading: { isAmountInputActive: true } },
        });

        expect(toJSON()).toBeNull();
    });

    it("should render provider's Terms & Conditions link when quote and provider infos are provided", async () => {
        const { getByText } = renderFooter({
            wallet: {
                trading: {
                    currentProviderMetadata: exchangeCexdirect,
                },
            },
        });

        expect(getByText(/Cexdirect/)).toBeOnTheScreen();
        await userEvent.press(getByText('Terms apply'));

        expect(mockOpenLink).toHaveBeenCalledTimes(1);
        expect(mockOpenLink).toHaveBeenCalled();
    });

    it('pressing link should open sheet', async () => {
        const { getByText } = renderFooter({});

        await userEvent.press(
            getByText(
                getTranslation('moduleTrading.tradingScreen.footer.howTradingWorksSheet.title'),
            ),
        );

        expect(mockOpenModal).toHaveBeenCalledTimes(1);
    });
});
