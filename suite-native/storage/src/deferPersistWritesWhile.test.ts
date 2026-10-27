import { AppState, type AppStateStatus } from 'react-native';

import { type DeferrablePersistStorage } from './createDeferrablePersistStorage';
import { deferPersistWritesWhile } from './deferPersistWritesWhile';

type State = { isBusy: boolean };

const createDeps = () => {
    let state: State = { isBusy: false };
    let notifyStore = () => {};
    let notifyAppState: (appState: AppStateStatus) => void = () => {};

    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
        notifyAppState = listener as typeof notifyAppState;

        return { remove: jest.fn() };
    });

    const deferrablePersistStorage: DeferrablePersistStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        deferWrites: jest.fn(),
        resumeWrites: jest.fn().mockResolvedValue(undefined),
        flushWrites: jest.fn().mockResolvedValue(undefined),
    };
    const store = {
        getState: () => state,
        subscribe: (listener: () => void) => {
            notifyStore = listener;

            return jest.fn();
        },
    };

    return {
        deps: { store, deferrablePersistStorage },
        setIsBusy: (isBusy: boolean) => {
            state = { isBusy };
            notifyStore();
        },
        moveAppTo: (appState: AppStateStatus) => notifyAppState(appState),
    };
};

const shouldDeferWrites = (state: State) => state.isBusy;

describe(deferPersistWritesWhile.name, () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('defers the writes while the condition holds and resumes them once it stops holding', () => {
        const { deps, setIsBusy } = createDeps();
        deferPersistWritesWhile(deps, { shouldDeferWrites });

        setIsBusy(true);
        setIsBusy(true);

        expect(deps.deferrablePersistStorage.deferWrites).toHaveBeenCalledTimes(1);
        expect(deps.deferrablePersistStorage.resumeWrites).not.toHaveBeenCalled();

        setIsBusy(false);
        setIsBusy(false);

        expect(deps.deferrablePersistStorage.resumeWrites).toHaveBeenCalledTimes(1);
    });

    it('flushes the deferred writes when the app goes to background', () => {
        const { deps, moveAppTo } = createDeps();
        deferPersistWritesWhile(deps, { shouldDeferWrites });

        moveAppTo('inactive');
        expect(deps.deferrablePersistStorage.flushWrites).not.toHaveBeenCalled();

        moveAppTo('background');
        expect(deps.deferrablePersistStorage.flushWrites).toHaveBeenCalledTimes(1);
    });
});
