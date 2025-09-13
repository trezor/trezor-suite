import { sendFormActions } from '@suite-common/wallet-core';
import {
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { useTradingOutputsReviewScreenControls } from '../useTradingOutputsReviewScreenControls';

const mockUseExchangeFlow = {
    signAndSendTransaction: jest.fn(),
    isConsentRequested: false,
    resolveConsent: jest.fn(),
};

const mockUseConfirmOnTrezorController = {
    confirmOnTrezorRef: { current: null },
    closeSheet: jest.fn(),
};

jest.mock('../../exchange/useExchangeFlow', () => ({
    useExchangeFlow: () => mockUseExchangeFlow,
}));

jest.mock('@suite-native/device', () => ({
    ...jest.requireActual('@suite-native/device'),
    useConfirmOnTrezorController: () => mockUseConfirmOnTrezorController,
}));

describe('useTradingOutputsReviewScreenControls', () => {
    let store: TestStore;

    const renderUseTradingOutputsReviewScreenControls = () =>
        renderHookWithStoreProviderAsync(() => useTradingOutputsReviewScreenControls(), {
            store,
        });

    beforeEach(async () => {
        jest.clearAllMocks();
        store = await initStore();
    });

    it('should return values from useExchangeFlow', async () => {
        const { result } = await renderUseTradingOutputsReviewScreenControls();

        expect(result.current.isConsentRequested).toBe(mockUseExchangeFlow.isConsentRequested);
        expect(result.current.resolveConsent).toBe(mockUseExchangeFlow.resolveConsent);
    });

    it('should return confirmOnTrezorRef', async () => {
        const { result } = await renderUseTradingOutputsReviewScreenControls();

        expect(result.current.confirmOnTrezorRef).toBe(
            mockUseConfirmOnTrezorController.confirmOnTrezorRef,
        );
    });

    describe('without signed transaction', () => {
        it('should call signAndSendTransaction on mount', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockUseExchangeFlow.signAndSendTransaction).toHaveBeenCalledTimes(1);
        });

        it('should not call closeSheet', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockUseConfirmOnTrezorController.closeSheet).not.toHaveBeenCalled();
        });
    });

    describe('with signed transaction', () => {
        beforeEach(() => {
            act(() => {
                store.dispatch(
                    sendFormActions.storeSignedTransaction({
                        serializedTx: {
                            symbol: 'btc',
                            tx: 'txid',
                        },
                    }),
                );
            });
        });

        it('should not call signAndSendTransaction', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockUseExchangeFlow.signAndSendTransaction).not.toHaveBeenCalled();
        });

        it('should closeSheet', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockUseConfirmOnTrezorController.closeSheet).toHaveBeenCalledTimes(1);
        });
    });
});
