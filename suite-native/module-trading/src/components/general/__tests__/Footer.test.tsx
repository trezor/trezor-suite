import { Linking } from 'react-native';

import { userEvent } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils/store';
import { exchangeCexdirect } from '@suite-native/trading-fixtures';
import { TREZOR_SUITE_TOS_URL, TREZOR_TRADING_LEARN_MORE_URL } from '@trezor/urls';

import { Footer } from '../Footer';

describe('Footer', () => {
    const mockOpenLink = jest.spyOn(Linking, 'openURL');

    const renderFooter = (preloadedState: PreloadedState) =>
        renderWithStoreProvider(<Footer />, { preloadedState });

    beforeEach(() => {
        mockOpenLink.mockClear();
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

        expect(mockOpenLink).toHaveBeenCalledTimes(1);
        expect(mockOpenLink).toHaveBeenCalled();
    });

    it('pressing links should lead to correct URLs', async () => {
        const { getByText } = renderFooter({});

        await userEvent.press(getByText("Trezor's Terms of Use"));
        await userEvent.press(getByText('Learn more'));

        expect(mockOpenLink).toHaveBeenCalledTimes(2);
        expect(mockOpenLink).toHaveBeenNthCalledWith(1, TREZOR_SUITE_TOS_URL);
        expect(mockOpenLink).toHaveBeenNthCalledWith(2, TREZOR_TRADING_LEARN_MORE_URL);
    });
});
