import { extraDependenciesMock } from '@suite-common/test-utils';

import { transactionsInitialState, prepareTransactionsReducer } from '../transactionsReducer';
import { transactionsActions } from '../transactionsActions';
import * as fixtures from '../__fixtures__/transactionsReducer';

const transactionsReducer = prepareTransactionsReducer(extraDependenciesMock);

describe('transactionsReducer', () => {
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

            expect(result.transactions).toEqual(f.result);
        });
    });
});
