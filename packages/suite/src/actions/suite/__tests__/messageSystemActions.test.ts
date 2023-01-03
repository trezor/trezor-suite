import { configureStore } from '@suite/support/tests/configureStore';

import messageSystemReducer, {
    State as MessageSystemState,
} from '@suite-reducers/messageSystemReducer';
import * as messageSystemActions from '../messageSystemActions';
import * as messageSystemConstants from '../constants/messageSystemConstants';
import * as fixtures from '../__fixtures__/messageSystemActions';

export const getInitialState = (state?: MessageSystemState) => ({
    messageSystem: {
        ...messageSystemReducer(undefined, { type: 'foo' } as any),
        ...state,
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { messageSystem } = store.getState();
        store.getState().messageSystem = messageSystemReducer(messageSystem, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('Message system actions', () => {
    beforeAll(() => {
        process.env.PUBLIC_KEY = fixtures.DEV_JWS_PUBLIC_KEY;
    });

    describe('init - with valid JWS', () => {
        beforeEach(() => {
            const mockFetchPromise = Promise.resolve({
                ok: true,
                text: () => Promise.resolve(fixtures.validJws),
            });
            global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);
            // @ts-expect-error
            jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise);
        });

        it("stores the fetched config if it's sequence number is higher than the current one", async () => {
            const timestamp = 123456789;
            jest.spyOn(Date, 'now').mockImplementation(() => timestamp);

            const store = initStore({
                messageSystem: { ...getInitialState().messageSystem, currentSequence: 0 },
            });

            await store.dispatch(messageSystemActions.init());

            expect(store.getActions().length).toBe(1);
            expect(store.getActions()[0].type).toBe(
                messageSystemConstants.FETCH_CONFIG_SUCCESS_UPDATE,
            );
            expect(store.getActions()[0].payload.config).not.toBe(undefined);
            expect(store.getActions()[0].payload.timestamp).toBe(timestamp);
        });

        it("does not store the fetched config if it's sequence number is the same as the current one", async () => {
            const store = initStore({
                messageSystem: { ...getInitialState().messageSystem, currentSequence: 1 },
            });

            await store.dispatch(messageSystemActions.init());

            expect(store.getActions().length).toBe(1);
            expect(store.getActions()[0].type).toBe(messageSystemConstants.FETCH_CONFIG_SUCCESS);
        });

        it('raises an error if sequence number of fetched config is lower than the current one', async () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});

            const store = initStore({
                messageSystem: { ...getInitialState().messageSystem, currentSequence: 15 },
            });

            await store.dispatch(messageSystemActions.init());

            expect(store.getActions().length).toBe(1);
            expect(store.getActions()[0].type).toBe(messageSystemConstants.FETCH_CONFIG_ERROR);
            expect(console.error).toHaveBeenCalled();
        });

        it('does not init fetching process of config if stored timestamp with variance is higher than current timestamp', () => {
            const timestamp = 1600000000;
            jest.spyOn(Date, 'now').mockImplementation(() => timestamp - 1000);

            const store = initStore({
                messageSystem: { ...getInitialState().messageSystem, timestamp },
            });

            store.dispatch(messageSystemActions.init());

            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('fetches local jws if the remote one fails', async () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            const mockSecondFetchPromise = Promise.resolve({
                ok: true,
                text: () => Promise.resolve(fixtures.validJwsWithSequence10),
            });
            global.fetch = jest
                .fn()
                .mockImplementationOnce(() => undefined)
                .mockImplementationOnce(() => mockSecondFetchPromise);

            const store = initStore({
                messageSystem: { ...getInitialState().messageSystem, currentSequence: 1 },
            });

            await store.dispatch(messageSystemActions.init());

            expect(store.getActions().length).toBe(1);
            expect(store.getActions()[0].type).toBe(
                messageSystemConstants.FETCH_CONFIG_SUCCESS_UPDATE,
            );
            expect(store.getActions()[0].payload.config).not.toBe(undefined);
            expect(store.getActions()[0].payload.config.sequence).toBe(10);
            expect(store.getActions()[0].payload.timestamp).toBe(0);

            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('init - with invalid JWS', () => {
        beforeEach(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        it('raises an error if fetched jws signature is invalid', async () => {
            const mockFetchPromise = Promise.resolve({
                ok: true,
                text: () => Promise.resolve(fixtures.unauthenticJws),
            });
            global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);

            const store = initStore({
                messageSystem: { ...getInitialState().messageSystem, currentSequence: 15 },
            });

            await store.dispatch(messageSystemActions.init());

            expect(store.getActions().length).toBe(1);
            expect(store.getActions()[0].type).toBe(messageSystemConstants.FETCH_CONFIG_ERROR);
            expect(console.error).toHaveBeenCalled();
        });

        it('raises an error if fetched jws is invalid', async () => {
            const mockFetchPromise = Promise.resolve({
                ok: true,
                text: () => Promise.resolve(fixtures.corruptedJws),
            });
            global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);

            const store = initStore({
                messageSystem: { ...getInitialState().messageSystem, currentSequence: 1 },
            });

            await store.dispatch(messageSystemActions.init());

            expect(store.getActions().length).toBe(1);
            expect(store.getActions()[0].type).toBe(messageSystemConstants.FETCH_CONFIG_ERROR);
            expect(console.error).toHaveBeenCalled();
        });
    });

    it('saveValidMessages', () => {
        const store = initStore(getInitialState());

        const bannerMessages = [fixtures.messageId1, fixtures.messageId2, fixtures.messageId3];
        const contextMessages = [fixtures.messageId2];
        const modalMessages = [fixtures.messageId1];
        const featureMessages = [fixtures.messageId3];

        const payload = {
            banner: [fixtures.messageId1, fixtures.messageId2, fixtures.messageId3],
            context: [fixtures.messageId2],
            modal: [fixtures.messageId1],
            feature: [fixtures.messageId3],
        };

        store.dispatch(messageSystemActions.saveValidMessages(payload));

        expect(store.getState().messageSystem.validMessages.banner.length).toEqual(
            bannerMessages.length,
        );
        expect(store.getState().messageSystem.validMessages.context.length).toEqual(
            contextMessages.length,
        );
        expect(store.getState().messageSystem.validMessages.modal.length).toEqual(
            modalMessages.length,
        );
        expect(store.getState().messageSystem.validMessages.feature.length).toEqual(
            featureMessages.length,
        );

        expect(store.getState().messageSystem.validMessages.banner).toEqual(bannerMessages);
        expect(store.getState().messageSystem.validMessages.context).toEqual(contextMessages);
        expect(store.getState().messageSystem.validMessages.modal).toEqual(modalMessages);
        expect(store.getState().messageSystem.validMessages.feature).toEqual(featureMessages);
    });

    it('dismissMessage', () => {
        const store = initStore(getInitialState());

        store.dispatch(messageSystemActions.dismissMessage(fixtures.messageId1, 'banner'));

        expect(Object.keys(store.getState().messageSystem.dismissedMessages).length).toEqual(1);

        expect(store.getState().messageSystem.dismissedMessages[fixtures.messageId1]).toEqual({
            banner: true,
            context: false,
            modal: false,
            feature: false,
        });

        store.dispatch(messageSystemActions.dismissMessage(fixtures.messageId1, 'modal'));
        expect(Object.keys(store.getState().messageSystem.dismissedMessages).length).toEqual(1);

        store.dispatch(messageSystemActions.dismissMessage(fixtures.messageId2, 'context'));
        expect(Object.keys(store.getState().messageSystem.dismissedMessages).length).toEqual(2);

        expect(store.getState().messageSystem.dismissedMessages[fixtures.messageId1]).toEqual({
            banner: true,
            context: false,
            modal: true,
            feature: false,
        });
        expect(store.getState().messageSystem.dismissedMessages[fixtures.messageId2]).toEqual({
            banner: false,
            context: true,
            modal: false,
            feature: false,
        });
    });
});
