import { ActionCreatorWithoutPayload } from '@reduxjs/toolkit';

import { type TestStore, initStore, renderHookWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { AbortablePromise } from '@suite-native/trading-types';

import { UseQuotesInvalidatorProps, useQuotesInvalidator } from '../useQuotesInvalidator';

describe('useQuotesInvalidator', () => {
    let store: TestStore;

    const renderUseQuotesInvalidator = ({
        isFormValid = false,
        isLoading = false,
        anyQuotesLoaded = false,
        quotesPromiseRef = { current: undefined },
        debounce = jest.fn(),
        getClearRequestAction = (() => ({
            type: 'clearRequestAction',
        })) as ActionCreatorWithoutPayload,
        getClearStateAction = (() => ({ type: 'clearStateAction' })) as ActionCreatorWithoutPayload,
    }: Partial<UseQuotesInvalidatorProps>) =>
        renderHookWithStoreProviderAsync(props => useQuotesInvalidator(props), {
            store,
            initialProps: {
                isFormValid,
                isLoading,
                anyQuotesLoaded,
                quotesPromiseRef,
                debounce,
                getClearRequestAction,
                getClearStateAction,
            },
        });

    beforeEach(() => {
        store = initStore().store;
    });

    it('should call debounce with empty method when form is not valid', async () => {
        const debounceMock = jest.fn();
        await renderUseQuotesInvalidator({
            debounce: debounceMock,
        });

        expect(debounceMock).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should not call debounce when form is valid', async () => {
        const debounceMock = jest.fn();
        await renderUseQuotesInvalidator({
            debounce: debounceMock,
            isFormValid: true,
        });

        expect(debounceMock).not.toHaveBeenCalled();
    });

    describe('promise aborting', () => {
        it('should abort quotesPromise when form is invalid and quotes are loading', async () => {
            const abortMock = jest.fn();
            const quotesPromiseRef = {
                current: { abort: abortMock } as unknown as AbortablePromise,
            };
            await renderUseQuotesInvalidator({
                isFormValid: false,
                isLoading: true,
                quotesPromiseRef,
            });

            expect(abortMock).toHaveBeenCalledWith('Invalidating quotes');
        });

        it('should abort quotesPromise on unmount', async () => {
            const abortMock = jest.fn();
            const quotesPromiseRef = {
                current: { abort: abortMock } as unknown as AbortablePromise,
            };
            const { unmount } = await renderUseQuotesInvalidator({
                isFormValid: true,
                quotesPromiseRef,
            });

            unmount();

            expect(abortMock).toHaveBeenCalledWith('Component unmounted');
        });

        it('should not abort quotesPromise when form is valid', async () => {
            const abortMock = jest.fn();
            const quotesPromiseRef = {
                current: { abort: abortMock } as unknown as AbortablePromise,
            };
            await renderUseQuotesInvalidator({
                isFormValid: true,
                quotesPromiseRef,
            });

            expect(abortMock).not.toHaveBeenCalled();
        });

        it('should not abort quotesPromise when form is invalid but quotes are not loading', async () => {
            const abortMock = jest.fn();
            const quotesPromiseRef = {
                current: { abort: abortMock } as unknown as AbortablePromise,
            };
            await renderUseQuotesInvalidator({
                isFormValid: false,
                isLoading: false,
                quotesPromiseRef,
            });

            expect(abortMock).not.toHaveBeenCalled();
        });
    });

    describe('getClearRequestAction', () => {
        it('should dispatch clear request action', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            await renderUseQuotesInvalidator({
                isFormValid: false,
                anyQuotesLoaded: true,
            });

            expect(dispatchSpy).toHaveBeenCalledWith({ type: 'clearRequestAction' });
        });

        it('should not dispatch clear request when no quotes are loaded', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            await renderUseQuotesInvalidator({
                isFormValid: false,
                anyQuotesLoaded: false,
            });

            expect(dispatchSpy).not.toHaveBeenCalledWith({ type: 'clearStateAction' });
        });

        it('should not dispatch clear request when form is valid', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            await renderUseQuotesInvalidator({
                isFormValid: true,
                anyQuotesLoaded: true,
            });

            expect(dispatchSpy).not.toHaveBeenCalledWith({ type: 'clearStateAction' });
        });
    });

    describe('getClearStateAction', () => {
        it('should dispatch clear state action on unmount', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { unmount } = await renderUseQuotesInvalidator({});

            unmount();

            expect(dispatchSpy).toHaveBeenCalledWith({ type: 'clearStateAction' });
        });
    });
});
