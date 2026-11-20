import type { FunctionComponent } from 'react';

import type { Account } from '@suite-common/wallet-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type SignVerifyProps<TNetworkSymbol extends string = NetworkSymbol> = {
    networkSymbol: NetworkSymbol & TNetworkSymbol;
    account: Account;
};

export type SignVerify<TNetworkSymbol extends string = NetworkSymbol> = {
    Component: FunctionComponent<SignVerifyProps<TNetworkSymbol>>;
};

/** @serviceContract */
export type GetSignVerify = (networkSymbol: NetworkSymbol) => SignVerify | null;

export type GetSignVerifyDep = {
    getSignVerify: GetSignVerify;
};

export const injectGetSignVerify = (services: any): GetSignVerifyDep => ({
    getSignVerify: services.getSignVerify,
});
