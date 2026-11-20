import type { ComponentType } from 'react';

import type { TranslationKey } from '@suite/intl';
import type { Account } from '@suite-common/wallet-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type SignVerifyProps<TNetworkSymbol extends string = NetworkSymbol> = {
    account: Account & { symbol: TNetworkSymbol };
};

export type SignVerify<TNetworkSymbol extends string = NetworkSymbol> = {
    Component: ComponentType<SignVerifyProps<TNetworkSymbol>>;
    title: TranslationKey;
};

/** @serviceContract */
export type GetSignVerify = (account: Account) => SignVerify | null;
