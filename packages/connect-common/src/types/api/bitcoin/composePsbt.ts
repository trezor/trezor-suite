import type { AccountAddresses, Utxo as AccountUtxo } from '@trezor/blockchain-link';
import type { ComposeInput as ComposeInputBase } from '@trezor/utxo-lib';

import type { PrecomposeResultFinal } from './composeTransaction';
import { type CoinSymbol } from '../../coinInfo';
import type { Params, Response } from '../../params';

export type ComposeUtxo = AccountUtxo & Partial<ComposeInputBase>;

export type ComposePsbtParams = {
    account: {
        path: string;
        addresses: AccountAddresses;
        utxo: ComposeUtxo[];
    };
    coin: CoinSymbol;
    psbtData: string;
};

export declare function composePsbt(
    params: Params<ComposePsbtParams>,
): Response<PrecomposeResultFinal>;
