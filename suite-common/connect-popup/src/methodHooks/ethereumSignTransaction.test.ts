import { getNetwork } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';

import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import { ethereumSignTransaction } from './ethereumSignTransaction';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: { ethereumGetAddress: jest.fn() },
}));

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: () => ({ path: '1', instance: 0, useEmptyPassphrase: true }),
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountForNetworkSymbolAndPath: () => ({ key: 'account-key' }),
}));

const mockedGetAddress = TrezorConnect.ethereumGetAddress as jest.Mock;

const runPreCallHook = (chainId: number) => {
    const dispatch = jest.fn(action => {
        // Stands in for the user confirming the simulation modal. Deferred to the next tick
        // because the hook creates the permission deferred right after this dispatch.
        if (connectPopupActions.txSimulation.match(action)) {
            setTimeout(() => getPermissionDeferred().resolve());
        }

        return action;
    });

    const run = ethereumSignTransaction.preCallHook({
        method: 'ethereumSignTransaction',
        payload: {
            path: "m/44'/60'/0'/0/0",
            transaction: { to: '0x0', value: '0x0', gasLimit: '0x5208', nonce: '0x0', chainId },
        },
        dispatch,
        getState: () => ({}),
        source: { type: 'walletconnect', manifest: { appName: 'dapp' } },
    } as any);

    return { run, dispatch };
};

describe('ethereumSignTransaction.preCallHook', () => {
    beforeEach(() => {
        mockedGetAddress.mockResolvedValue({ success: true, payload: { address: '0xabc' } });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('opens the simulation modal for a chain Blockaid can scan', async () => {
        const { run, dispatch } = runPreCallHook(getNetwork('eth').chainId);
        await run;

        expect(dispatch).toHaveBeenCalledWith(
            connectPopupActions.txSimulation({ fromAddress: '0xabc' }),
        );
    });

    it.each([
        ['Arc', getNetwork('arc').chainId],
        ['Arc Testnet', getNetwork('tarc').chainId],
        ['Ethereum Classic', getNetwork('etc').chainId],
    ])('skips the simulation modal on %s, which Blockaid cannot scan', async (_name, chainId) => {
        const { run, dispatch } = runPreCallHook(chainId);
        await run;

        expect(mockedGetAddress).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: connectPopupActions.txSimulation.type }),
        );
    });
});
