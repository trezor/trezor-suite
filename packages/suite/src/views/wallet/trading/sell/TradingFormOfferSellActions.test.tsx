import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { configureMockStore } from '@suite-common/test-utils';
import { initialState as tradingInitialState } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/connect';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingFormOfferSellActions } from './TradingFormOfferSellActions';
import { extraDependenciesDesktopMock } from '../../../../../mocks/extraDependenciesDesktopMock';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

const mockUseTradingFormContext = jest.fn();
const mockUseTradingFormOfferCommon = jest.fn();

jest.mock('src/hooks/wallet/trading/form/useTradingCommonForm', () => ({
    useTradingFormContext: () => mockUseTradingFormContext(),
}));

jest.mock(
    'src/views/wallet/trading/common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon',
    () => ({ useTradingFormOfferCommon: () => mockUseTradingFormOfferCommon() }),
);

jest.mock(
    'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton',
    () => ({
        TradingFormOfferConfirmButton: ({
            isDisabled,
            testId,
        }: {
            isDisabled: boolean;
            testId: string;
        }) => <button data-testid={testId} disabled={isDisabled} />,
    }),
);

jest.mock('src/views/wallet/trading/common/TradingKYCWarning', () => ({
    TradingKYCWarning: () => null,
}));

jest.mock(
    'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferOTC',
    () => ({ TradingFormOfferOTC: () => null }),
);

const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';

const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    balance: '1000000000000000000',
});

const renderWithNetworkFee = (composed: { fee: string } | undefined) => {
    const store = configureMockStore({
        preloadedState: {
            ...mockInitialAppState,
            device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
            wallet: {
                ...mockInitialAppState.wallet,
                accounts: [account],
                trading: {
                    ...tradingInitialState,
                    composedTransactionInfo: { composed },
                },
            },
        } as unknown as AppState,
    });

    renderWithProviders(
        store,
        extraDependenciesDesktopMock.services,
        <TradingFormOfferSellActions />,
    );
};

describe('TradingFormOfferSellActions', () => {
    beforeEach(() => {
        mockUseTradingFormContext.mockReturnValue({
            watch: () => ({ outputs: [] }),
            shouldSendInSats: false,
            form: { state: { isFormLoading: false } },
        });
        mockUseTradingFormOfferCommon.mockReturnValue({
            quote: { orderId: 'test-order' },
            confirmButtonData: {},
            isBaseButtonDisabled: false,
        });
    });

    it.each([
        ['is enabled when the network fee is present', { fee: '12345' }, false],
        ['is disabled when the network fee is missing', undefined, true],
        ['is disabled when the network fee is an empty string', { fee: '' }, true],
    ] as [string, { fee: string } | undefined, boolean][])(
        'confirm button %s',
        (_title, composed, expectedDisabled) => {
            renderWithNetworkFee(composed);

            expect(screen.getByTestId('@trading/form/sell-button')).toHaveProperty(
                'disabled',
                expectedDisabled,
            );
        },
    );
});
