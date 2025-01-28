import { extraDependenciesMock } from '@suite-common/test-utils';

import * as fixtures from '../__fixtures__/transactionsReducer';
import { transactionsActions } from '../transactionsActions';
import { prepareTransactionsReducer, transactionsInitialState } from '../transactionsReducer';

const transactionsReducer = prepareTransactionsReducer(extraDependenciesMock);

describe('transactionsReducer', () => {
    describe('addTransaction', () => {
        fixtures.addTransaction.forEach(f => {
            it(f.description, () => {
                const result = transactionsReducer(
                    {
                        ...transactionsInitialState,
                        ...f.initialState,
                    },
                    {
                        type: transactionsActions.addTransaction.type,
                        payload: f.actionPayload,
                    },
                );

                expect(result.transactions).toStrictEqual(f.result);
            });
        });
    });

    describe('removeTransaction', () => {
        fixtures.removeTransaction.forEach(f => {
            it(f.description, () => {
                const result = transactionsReducer(
                    {
                        ...transactionsInitialState,
                        ...f.initialState,
                    },
                    {
                        type: transactionsActions.removeTransaction.type,
                        payload: f.actionPayload,
                    },
                );

                expect(result.transactions).toStrictEqual(f.result);
            });
        });
    });
});
