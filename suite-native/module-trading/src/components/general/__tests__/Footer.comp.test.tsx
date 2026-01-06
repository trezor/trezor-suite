import { Linking } from 'react-native';

import type { CryptoId } from 'invity-api';

import { PreloadedState, renderWithStoreProviderAsync, userEvent } from '@suite-native/test-utils';
import { TREZOR_SUITE_TOS_URL, TREZOR_TRADING_LEARN_MORE_URL } from '@trezor/urls';

import { Footer } from '../Footer';

describe('Footer', () => {
    const mockOpenLink = jest.spyOn(Linking, 'openURL');

    const renderFooter = (preloadedState: PreloadedState) =>
        renderWithStoreProviderAsync(<Footer type="exchange" />, { preloadedState });

    beforeEach(() => {
        mockOpenLink.mockClear();
    });

    it('should render footer links', async () => {
        const { getByText } = await renderFooter({});

        expect(getByText("Trezor's Terms of Use")).toBeOnTheScreen();
        expect(getByText('Learn more')).toBeOnTheScreen();
    });

    it('should render nothing when isAmountInputActive is true', async () => {
        const { toJSON } = await renderWithStoreProviderAsync(<Footer type="exchange" />, {
            preloadedState: {
                wallet: { trading: { isAmountInputActive: true } },
            },
        });

        expect(toJSON()).toBeNull();
    });

    it("should render provider's Terms & Conditions link when quote and provider infos are provided", async () => {
        const { getByText } = await renderWithStoreProviderAsync(<Footer type="exchange" />, {
            preloadedState: {
                wallet: {
                    trading: {
                        exchange: {
                            selectedQuote: {
                                send: 'litecoin' as CryptoId,
                                sendStringAmount: '12',
                                receive: 'bitcoin' as CryptoId,
                                receiveStringAmount: '0.0609979',
                                rate: 0.005083158333333333,
                                min: 0.5688,
                                max: 'NONE',
                                fee: 'UNKNOWN',
                                exchange: 'changenow',
                            },
                            exchangeInfo: {
                                providerInfos: {
                                    changenow: {
                                        isFixedRate: true,
                                        isDex: false,
                                        buyTickers: [],
                                        sellTickers: [],
                                        addressFormats: {},
                                        kycUrl: '',
                                        supportUrl: '',
                                        kycPolicy: '',
                                        kycPolicyType: 'noKYC',
                                        isRefundRequired: false,
                                        name: 'ChangeNOW',
                                        companyName: 'ChangeNOW',
                                        logo: '',
                                        isActive: true,
                                        isDisabled: false,
                                        disabledCurrencies: [],
                                        supportedCountries: [],
                                        disabledCountries: [],
                                        statusUrl: '',
                                        termsUrl: 'https://example.com',
                                        disabledClientVersions: [],
                                    },
                                },
                                buyCryptoIds: [],
                                sellCryptoIds: [],
                            },
                        },
                    },
                },
            },
        });

        expect(getByText("ChangeNOW's Terms & Conditions")).toBeOnTheScreen();
        await userEvent.press(getByText("ChangeNOW's Terms & Conditions"));

        expect(mockOpenLink).toHaveBeenCalledTimes(1);
        expect(mockOpenLink).toHaveBeenCalled();
    });

    it('pressing links should lead to correct URLs', async () => {
        const { getByText } = await renderFooter({});

        await userEvent.press(getByText("Trezor's Terms of Use"));
        await userEvent.press(getByText('Learn more'));

        expect(mockOpenLink).toHaveBeenCalledTimes(2);
        expect(mockOpenLink).toHaveBeenNthCalledWith(1, TREZOR_SUITE_TOS_URL);
        expect(mockOpenLink).toHaveBeenNthCalledWith(2, TREZOR_TRADING_LEARN_MORE_URL);
    });
});
