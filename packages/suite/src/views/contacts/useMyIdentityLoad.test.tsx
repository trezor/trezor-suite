import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';

import { type StaticSessionId } from '@trezor/connect';
import { type Result, err, ok } from '@trezor/type-utils';

import { type ContactsError } from 'src/utils/contacts/contactsErrors';

import { useMyIdentityLoad } from './useMyIdentityLoad';

const mockLoadIdentity = jest.fn<Promise<Result<string, ContactsError>>, []>();

// The thunk has its own tests; here it only answers when the test resolves it.
jest.mock('src/actions/suite/contactsThunks', () => ({
    loadIdentityThunk: () => () => ({ unwrap: () => mockLoadIdentity() }),
}));

const WALLET_A: StaticSessionId = 'walletA@deviceid:0';
const WALLET_B: StaticSessionId = 'walletB@deviceid:1';
const NPUB = 'a'.repeat(64);

type IdentityLoadProps = {
    deviceState: StaticSessionId | undefined;
    identityNpub: string | undefined;
};

// Each load waits until the test settles it, so the wallet can change while the device answers.
const deferLoad = () => {
    let settle: (result: Result<string, ContactsError>) => void = () => {};
    mockLoadIdentity.mockImplementationOnce(
        () =>
            new Promise(resolve => {
                settle = resolve;
            }),
    );

    return (result: Result<string, ContactsError>) =>
        act(async () => {
            settle(result);
            await Promise.resolve();
        });
};

const renderIdentityLoad = () => {
    const store = configureStore({ reducer: () => ({}) });
    const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider store={store}>{children}</Provider>
    );
    const initialProps: IdentityLoadProps = { deviceState: WALLET_A, identityNpub: undefined };

    return renderHook(
        ({ deviceState, identityNpub }) =>
            useMyIdentityLoad({ deviceState, identityNpub, isDeviceLocked: false }),
        { initialProps, wrapper },
    );
};

describe('useMyIdentityLoad', () => {
    beforeEach(() => {
        mockLoadIdentity.mockReset();
    });

    it('loads a wallet again after its load was refused for a wallet switch', async () => {
        const settleWalletA = deferLoad();
        const { rerender } = renderIdentityLoad();

        rerender({ deviceState: WALLET_B, identityNpub: NPUB });
        await settleWalletA(err({ code: 'wallet_changed' }));
        deferLoad();
        rerender({ deviceState: WALLET_A, identityNpub: undefined });

        expect(mockLoadIdentity).toHaveBeenCalledTimes(2);
    });

    it("shows a wallet's failed load only while that wallet is selected", async () => {
        const settleWalletA = deferLoad();
        const { result, rerender } = renderIdentityLoad();

        rerender({ deviceState: WALLET_B, identityNpub: NPUB });
        await settleWalletA(err({ code: 'firmware_unsupported' }));

        expect(result.current.error).toBeNull();

        rerender({ deviceState: WALLET_A, identityNpub: undefined });

        expect(result.current.error).toEqual({ code: 'firmware_unsupported' });
    });

    it("keeps a wallet's load running when an earlier load of another wallet finishes", async () => {
        const settleWalletA = deferLoad();
        const { result, rerender } = renderIdentityLoad();

        deferLoad();
        rerender({ deviceState: WALLET_B, identityNpub: undefined });
        await settleWalletA(ok(NPUB));

        expect(result.current.isLoading).toBe(true);
    });
});
