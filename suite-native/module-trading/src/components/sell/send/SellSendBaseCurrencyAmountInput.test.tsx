import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    act,
    fireEvent,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
    userEvent,
} from '@suite-native/test-utils-store';
import { ethAsset } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';

import { SellSendBaseCurrencyAmountInput } from './SellSendBaseCurrencyAmountInput';
import { useSellForm } from '../../../hooks/sell/useSellForm';
import { createTradingPreloadedState } from '../../../test-utils/tradingTestUtils';

jest.mock('../../../hooks/general/useAmountInputDecimals', () => ({
    useAmountInputDecimals: () => 18,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: {} }),
}));

const services: NativeAnalyticsDep & { networks: NetworkModuleRepositoryDep } = {
    analytics: mockNativeAnalytics(),
    networks: { networkModuleRepository: mockNetworkModuleRepository() },
};

describe('SellSendBaseCurrencyAmountInput', () => {
    let form: SellFormType;
    const showAssetsScreenMock = jest.fn();
    const preloadedState = createTradingPreloadedState({ tradeType: 'sell' });
    const baseCurrencyAmountLabel = getTranslation(
        'moduleTrading.tradingScreen.baseCurrencyAmountLabel',
    );

    const renderInput = async () =>
        await renderWithStoreProvider(
            <SellSendBaseCurrencyAmountInput showAssetsScreen={showAssetsScreenMock} />,
            {
                wrapper: ({ children }) => <Form form={form}>{children}</Form>,
                preloadedState,
                services,
            },
        );

    beforeEach(async () => {
        showAssetsScreenMock.mockClear();
        const { result } = await renderHookWithStoreProvider(() => useSellForm(), {
            preloadedState,
            services,
        });
        form = result.current;

        await act(() => {
            form.setValue('sendAsset', ethAsset);
        });
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('should set crypto amount from typed base currency amount and switch to crypto amount', async () => {
        await act(() => {
            form.setValue('amountInCrypto', false);
            form.setValue('fiatStringAmount', '50');
        });
        const { getByLabelText } = await renderInput();

        await userEvent.type(getByLabelText(baseCurrencyAmountLabel), '250');

        expect(form.getValues('cryptoStringAmount')).toBe('0.25');
        expect(form.getValues('cryptoBaseCurrencyStringAmount')).toBe('250');
        expect(form.getValues('fiatStringAmount')).toBeUndefined();
        expect(form.getValues('amountInCrypto')).toBe(true);
        expect(getByLabelText(baseCurrencyAmountLabel)).toHaveDisplayValue('250');
    });

    it('should display base currency amount of crypto amount filled from quotes', async () => {
        await act(() => {
            form.setValue('amountInCrypto', false);
            form.setValue('cryptoStringAmount', '0.5');
        });
        const { getByLabelText } = await renderInput();

        expect(getByLabelText(baseCurrencyAmountLabel)).toHaveDisplayValue('500');
    });

    it('should show assets screen on press when no asset is selected', async () => {
        await act(() => {
            form.setValue('sendAsset', undefined);
        });
        const { getByLabelText } = await renderInput();

        await fireEvent.press(getByLabelText(baseCurrencyAmountLabel));

        expect(showAssetsScreenMock).toHaveBeenCalledTimes(1);
    });

    it('should not show assets screen on press when an asset is selected', async () => {
        const { getByLabelText } = await renderInput();

        await fireEvent.press(getByLabelText(baseCurrencyAmountLabel));

        expect(showAssetsScreenMock).not.toHaveBeenCalled();
    });
});
