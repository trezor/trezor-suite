import { selectDeviceAccounts } from '@suite-common/wallet-core';
import type { CallMethodKeys } from '@trezor/connect';

import { PreCallHookParams } from './types';

/**
 * Resolves `address` to `path` for signMessage and ethereumSignMessage methods.
 *
 * When the caller provides an `address` instead of a `path`, this hook looks up the address
 * in Suite's discovered accounts (Redux store) and resolves it to the corresponding BIP-32 path.
 */
export const signMessageHooks = {
    preCallHook: <M extends CallMethodKeys>(params: PreCallHookParams<M>) => {
        const { method, payload, getState } = params;

        if (method === 'signMessage') {
            const typedPayload = payload as { address?: string; path?: string; coin?: string };
            if (typedPayload.address && !typedPayload.path) {
                const accounts = selectDeviceAccounts(getState());
                for (const account of accounts) {
                    if (account.addresses) {
                        const allAddresses = [
                            ...account.addresses.used,
                            ...account.addresses.change,
                            ...account.addresses.unused,
                        ];
                        const addressInfo = allAddresses.find(
                            a => a.address === typedPayload.address,
                        );
                        if (addressInfo) {
                            return {
                                ...payload,
                                path: addressInfo.path,
                                coin: typedPayload.coin ?? account.symbol,
                            };
                        }
                    }

                    if (account.descriptor === typedPayload.address) {
                        return {
                            ...payload,
                            path: account.path,
                            coin: typedPayload.coin ?? account.symbol,
                        };
                    }
                }

                throw new Error(
                    `signMessage: Address "${typedPayload.address}" not found in discovered accounts`,
                );
            }
        }

        if (method === 'ethereumSignMessage') {
            const typedPayload = payload as { address?: string; path?: string };
            if (typedPayload.address && !typedPayload.path) {
                const accounts = selectDeviceAccounts(getState());
                const account = accounts.find(
                    a =>
                        a.networkType === 'ethereum' &&
                        a.descriptor.toLowerCase() === typedPayload.address!.toLowerCase(),
                );
                if (!account) {
                    throw new Error(
                        `ethereumSignMessage: Address "${typedPayload.address}" not found in discovered accounts`,
                    );
                }

                return {
                    ...payload,
                    path: account.path,
                };
            }
        }

        return undefined;
    },
};
