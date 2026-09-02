import { actionFixtures, selectorFixtures } from './__fixtures__/coinjoinReducer';
import { type CoinjoinAction, coinjoinReducer } from './coinjoinReducer';
import { type CoinjoinRootState, selectRegisteredUtxosByAccountKey } from './coinjoinSelectors';
import { type CoinjoinState } from './coinjoinTypes';

describe('Coinjoin reducer actions', () => {
    actionFixtures.forEach(f => {
        it(f.description, () => {
            let state = f.initialState as unknown as CoinjoinState;
            f.actions.forEach(a => {
                state = coinjoinReducer(state, a as CoinjoinAction);
            });
            expect(state).toEqual(f.result);
        });
    });
});

describe('Coinjoin reducer selectors', () => {
    const selectors = { selectRegisteredUtxosByAccountKey };

    selectorFixtures.forEach(f => {
        it(`${f.selector}: ${f.description}`, () => {
            const state = {
                suite: {},
                wallet: {
                    accounts: [],
                    selectedAccount: {},
                    coinjoin: f.initialState,
                },
            } as unknown as CoinjoinRootState;

            const selectorFn = selectors[f.selector];
            const args = [state, ...f.selectorArgs] as unknown as Parameters<typeof selectorFn>;

            const result = selectorFn(...args);
            expect(result).toEqual(f.result);
        });
    });
});
