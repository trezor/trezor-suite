import { Linking } from 'react-native';

import { PreloadedState, renderWithStoreProvider, userEvent } from '@suite-native/test-utils';
import { exchangeCexdirect } from '@suite-native/trading-fixtures';
import { TREZOR_SUITE_TOS_URL, TREZOR_TRADING_LEARN_MORE_URL } from '@trezor/urls';

import { Footer } from '../Footer';

const mockOpenURL = jest.fn<Promise<void>, [string]>();
const mockCanOpenURL = jest.fn<Promise<boolean>, [string]>();

// Replace Linking methods with plain jest.fn() to avoid restoreMocks interference
// with fire-and-forget async chains in the Link component.
const originalOpenURL = Linking.openURL;
const originalCanOpenURL = Linking.canOpenURL;

beforeAll(() => {
    Linking.openURL = mockOpenURL;
    Linking.canOpenURL = mockCanOpenURL;
});

afterAll(() => {
    Linking.openURL = originalOpenURL;
    Linking.canOpenURL = originalCanOpenURL;
});

describe('Footer', () => {
    const renderFooter = (preloadedState: PreloadedState) =>
        renderWithStoreProvider(<Footer />, { preloadedState });

    beforeEach(() => {
        mockOpenURL.mockResolvedValue(undefined);
        mockCanOpenURL.mockResolvedValue(true);
    });

    it('should render footer links', () => {
        const { getByText } = renderFooter({});

        expect(getByText("Trezor's Terms of Use")).toBeOnTheScreen();
        expect(getByText('Learn more')).toBeOnTheScreen();
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

        expect(getByText("Cexdirect's Terms & Conditions")).toBeOnTheScreen();
        await userEvent.press(getByText("Cexdirect's Terms & Conditions"));

        expect(mockOpenURL).toHaveBeenCalledTimes(1);
        expect(mockOpenURL).toHaveBeenCalled();
    });

    it('pressing links should lead to correct URLs', async () => {
        const { getByText } = renderFooter({});

        // Flush leaked fire-and-forget openLink() chains from previous tests
        await new Promise(resolve => setTimeout(resolve, 0));
        mockOpenURL.mockClear();

        await userEvent.press(getByText("Trezor's Terms of Use"));
        await userEvent.press(getByText('Learn more'));

        expect(mockOpenURL).toHaveBeenCalledTimes(2);
        expect(mockOpenURL).toHaveBeenNthCalledWith(1, TREZOR_SUITE_TOS_URL);
        expect(mockOpenURL).toHaveBeenNthCalledWith(2, TREZOR_TRADING_LEARN_MORE_URL);
    });
});
