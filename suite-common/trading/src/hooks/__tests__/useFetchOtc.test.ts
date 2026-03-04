import { act } from '@testing-library/react';

import { createTradingTestState, renderHookWithTradingStore } from '../../__tests__/testUtils';
import { invityAPI } from '../../invityAPI';
import { TradingOTC } from '../../types';
import { useFetchOtc } from '../useFetchOtc';

jest.mock('../../invityAPI');

const mockOtcData: TradingOTC = {
    country: 'CZ',
    minFiatLimits: { usd: 1000, eur: 900 } as TradingOTC['minFiatLimits'],
    links: [],
};

const renderUseFetchOtc = (preloadedState = createTradingTestState()) =>
    renderHookWithTradingStore(() => useFetchOtc(), { preloadedState });

describe('useFetchOtc', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        invityAPI.getCurrentApiKey = jest.fn().mockReturnValue('existing-key');
        invityAPI.createInvityAPIKey = jest.fn();
        invityAPI.getOTCData = jest.fn().mockResolvedValue(mockOtcData);
    });

    describe('initial state', () => {
        it('should return data, isLoading and refetch', async () => {
            const { result } = renderUseFetchOtc();

            await act(async () => {});

            expect(result.current).toHaveProperty('data');
            expect(result.current).toHaveProperty('isLoading');
            expect(result.current).toHaveProperty('refetch');
            expect(typeof result.current.refetch).toBe('function');
        });

        it('should start with isLoading true while fetching', () => {
            invityAPI.getOTCData = jest.fn(() => new Promise(() => {}));

            const { result } = renderUseFetchOtc();

            expect(result.current.isLoading).toBe(true);
        });

        it('should set isLoading to false after fetch completes', async () => {
            const { result } = renderUseFetchOtc();

            await act(async () => {});

            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('fetching OTC data', () => {
        it('should dispatch saveOtc and return data from store after successful fetch', async () => {
            const { result, store } = renderUseFetchOtc();

            await act(async () => {});

            const state = store.getState();
            expect(state.wallet.trading.otc).toEqual(mockOtcData);
            expect(result.current.data).toEqual(mockOtcData);
        });

        it('should call getOTCData on mount', async () => {
            renderUseFetchOtc();

            await act(async () => {});

            expect(invityAPI.getOTCData).toHaveBeenCalledTimes(1);
        });

        it('should return true from refetch when fetch succeeds', async () => {
            const { result } = renderUseFetchOtc();

            await act(async () => {});

            let refetchResult: boolean | undefined;
            await act(async () => {
                refetchResult = await result.current.refetch();
            });

            expect(refetchResult).toBe(true);
        });

        it('should return false when API returns undefined', async () => {
            invityAPI.getOTCData = jest.fn().mockResolvedValue(undefined);

            const { result } = renderUseFetchOtc();

            await act(async () => {});

            let refetchResult: boolean | undefined;
            await act(async () => {
                refetchResult = await result.current.refetch();
            });

            expect(refetchResult).toBe(false);
        });

        it('should return false when API throws an error', async () => {
            invityAPI.getOTCData = jest.fn().mockRejectedValue(new Error('Network error'));

            const { result } = renderUseFetchOtc();

            await act(async () => {});

            let refetchResult: boolean | undefined;
            await act(async () => {
                refetchResult = await result.current.refetch();
            });

            expect(refetchResult).toBe(false);
        });

        it('should not dispatch saveOtc when API returns undefined', async () => {
            invityAPI.getOTCData = jest.fn().mockResolvedValue(undefined);

            const { store } = renderUseFetchOtc();

            await act(async () => {});

            const state = store.getState() as any;
            expect(state.wallet.trading.otc).toBeUndefined();
        });
    });

    describe('API key handling', () => {
        it('should not create a fallback API key when one already exists', async () => {
            invityAPI.getCurrentApiKey = jest.fn().mockReturnValue('existing-key');

            renderUseFetchOtc();

            await act(async () => {});

            expect(invityAPI.createInvityAPIKey).not.toHaveBeenCalled();
        });

        it('should create a fallback API key when none exists', async () => {
            invityAPI.getCurrentApiKey = jest.fn().mockReturnValue(undefined);

            renderUseFetchOtc();

            await act(async () => {});

            expect(invityAPI.createInvityAPIKey).toHaveBeenCalledTimes(1);
        });
    });

    describe('refetch', () => {
        it('should re-fetch OTC data when refetch is called', async () => {
            const { result } = renderUseFetchOtc();

            await act(async () => {});

            expect(invityAPI.getOTCData).toHaveBeenCalledTimes(1);

            await act(async () => {
                await result.current.refetch();
            });

            expect(invityAPI.getOTCData).toHaveBeenCalledTimes(2);
        });

        it('should set isLoading to true while refetching', async () => {
            const { result } = renderUseFetchOtc();

            await act(async () => {});

            let resolveRefetch!: (value: TradingOTC) => void;
            invityAPI.getOTCData = jest.fn(
                () =>
                    new Promise<TradingOTC>(resolve => {
                        resolveRefetch = resolve;
                    }),
            );

            act(() => {
                void result.current.refetch();
            });

            expect(result.current.isLoading).toBe(true);

            await act(() => {
                resolveRefetch(mockOtcData);
            });

            expect(result.current.isLoading).toBe(false);
        });

        it('should update data in store after successful refetch', async () => {
            const { result, store } = renderUseFetchOtc();

            await act(async () => {});

            const updatedOtcData: TradingOTC = {
                ...mockOtcData,
                country: 'US',
            };
            invityAPI.getOTCData = jest.fn().mockResolvedValue(updatedOtcData);

            await act(async () => {
                await result.current.refetch();
            });

            const state = store.getState();
            expect(state.wallet.trading.otc).toEqual(updatedOtcData);
        });
    });

    describe('preloaded state', () => {
        it('should expose existing OTC data from store before fetch completes', () => {
            const preloadedState = createTradingTestState({ otc: mockOtcData });
            invityAPI.getOTCData = jest.fn(() => new Promise(() => {}));

            const { result } = renderUseFetchOtc(preloadedState);

            expect(result.current.data).toEqual(mockOtcData);
        });
    });
});
