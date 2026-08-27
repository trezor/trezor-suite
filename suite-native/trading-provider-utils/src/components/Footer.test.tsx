import { Linking } from 'react-native';

import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, userEvent } from '@suite-native/test-utils-store';
import { exchangeCexdirect, getWalletState } from '@suite-native/trading-fixtures';
import type { TradingState } from '@suite-native/trading-types';

import { Footer } from './Footer';

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

    const renderFooter = async (overrides: Partial<TradingState>) => {
        const walletState = getWalletState();
        const preloadedState = {
            wallet: {
                ...walletState,
                trading: {
                    ...walletState.trading,
                    ...overrides,
                },
            },
        };

        return await renderWithStoreProvider(<Footer />, { preloadedState });
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render footer info', async () => {
        const { getByText } = await renderFooter({});

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

    it('should render nothing when isAmountInputActive is true', async () => {
        const { toJSON } = await renderFooter({ isAmountInputActive: true });

        expect(toJSON()).toBeNull();
    });

    it("should render provider's Terms & Conditions link when quote and provider infos are provided", async () => {
        const { getByText } = await renderFooter({ currentProviderMetadata: exchangeCexdirect });

        expect(getByText(/Cexdirect/)).toBeOnTheScreen();
        await userEvent.press(
            getByText(getTranslation('moduleTrading.tradingScreen.footer.termsApply')),
        );

        expect(mockOpenLink).toHaveBeenCalledTimes(1);
        expect(mockOpenLink).toHaveBeenCalled();
    });

    it('pressing link should open sheet', async () => {
        const { getByText } = await renderFooter({});

        await userEvent.press(
            getByText(
                getTranslation('moduleTrading.tradingScreen.footer.howTradingWorksSheet.title'),
            ),
        );

        expect(mockOpenModal).toHaveBeenCalledTimes(1);
    });
});
