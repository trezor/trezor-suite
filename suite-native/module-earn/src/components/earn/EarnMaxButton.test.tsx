import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { type useFormContext } from '@suite-native/forms';
import { fireEvent, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { EarnMaxButton } from './EarnMaxButton';
import { type EarnFormValues } from '../../utils/earn/earnFormSchema';

const mockSetValue = mock<ReturnType<typeof useFormContext<EarnFormValues>>['setValue']>();

jest.mock('@suite-native/forms', () => ({
    ...jest.requireActual('@suite-native/forms'),
    useFormContext: () => ({ setValue: mockSetValue }),
}));
jest.mock('@suite-native/formatters', () => ({
    ...jest.requireActual('@suite-native/formatters'),
    useCryptoFiatConverters: () => undefined,
}));

describe('Stake max analytics', () => {
    it.each([false, true])('reports only selecting max, checked=%s', async isChecked => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
        };
        await renderWithStoreProvider(
            <EarnMaxButton
                accountKey={account.key}
                symbol={account.symbol}
                isChecked={isChecked}
                onChange={mock()}
            />,
            {
                services,
                preloadedState: {
                    wallet: {
                        accounts: [account],
                        settings: { localCurrency: 'usd', bitcoinAmountUnit: 0 },
                    },
                },
            },
        );

        await fireEvent.press(screen.getByRole('switch'));

        if (isChecked) {
            expect(services.analytics.report).not.toHaveBeenCalled();
        } else {
            expect(services.analytics.report).toHaveBeenCalledTimes(1);
            expect(services.analytics.report).toHaveBeenCalledWith({
                type: 'app/form-percent-buttons',
                payload: { type: 'staking', value: 'max' },
            });
        }
    });
});
