import { asNetworkSymbol } from '@suite-common/wallet-config';
import { accountsActions } from '@suite-common/wallet-core';

import { AbstractSignTransactionFlow } from './AbstractSignTransactionFlow';

const FIRST_PATH = "m/44'/60'/0'/0/0";
const SECOND_PATH = "m/44'/60'/1'/0/0";

// A hidden network is never looked up among real accounts, so a placeholder is always created.
class PlaceholderSignFlow extends AbstractSignTransactionFlow<'ethereumSignTransaction'> {
    protected prepareSigning() {
        this.selectSigningAccount(this.payload.path, {
            symbol: asNetworkSymbol('eth'),
            name: 'Placeholder',
            isHidden: true,
        });
    }
}

const createFlow = (path: string, dispatch: jest.Mock) =>
    new PlaceholderSignFlow(
        {
            method: 'ethereumSignTransaction',
            payload: {
                path,
                transaction: {
                    to: '0x0',
                    value: '0x0',
                    gasPrice: '0x1',
                    gasLimit: '0x5208',
                    nonce: '0x0',
                    chainId: 1,
                },
            },
            source: { type: 'web', origin: 'https://app.example', manifest: { appName: 'app' } },
        },
        {
            dispatch,
            getState: () => ({ networks: null }),
            signal: new AbortController().signal,
        },
    );

const getRemovedAccountPaths = (dispatch: jest.Mock) =>
    dispatch.mock.calls
        .map(([action]) => action)
        .filter(accountsActions.removeAccount.match)
        .map(action => action.payload.map(account => account.path));

describe('AbstractSignTransactionFlow.cleanup', () => {
    it('removes the placeholder account the flow created, once', async () => {
        const dispatch = jest.fn(action => action);
        const flow = createFlow(FIRST_PATH, dispatch);

        await flow['preCall']();
        flow.cleanup();
        flow.cleanup();

        expect(getRemovedAccountPaths(dispatch)).toEqual([[FIRST_PATH]]);
    });

    it('leaves the placeholder account of another flow in place', async () => {
        // A cancelled call can still be finishing while the next queued call is being reviewed.
        const dispatch = jest.fn(action => action);
        const cancelledFlow = createFlow(FIRST_PATH, dispatch);
        const nextFlow = createFlow(SECOND_PATH, dispatch);

        await cancelledFlow['preCall']();
        await nextFlow['preCall']();
        cancelledFlow.cleanup();

        expect(getRemovedAccountPaths(dispatch)).toEqual([[FIRST_PATH]]);
    });
});
