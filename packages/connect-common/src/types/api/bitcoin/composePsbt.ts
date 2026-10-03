import type { AccountAddresses, Utxo as AccountUtxo } from '@trezor/blockchain-link';
import type { ComposeInput as ComposeInputBase } from '@trezor/utxo-lib';

import type { PrecomposeResultFinal } from './composeTransaction';
import { type CoinSymbol } from '../../coinInfo';
import type { DeviceFreeParams, Response } from '../../params';

export type ComposeUtxo = AccountUtxo & Partial<ComposeInputBase>;

export type ComposePsbtParams = {
    account: {
        addresses: AccountAddresses;
        utxo: ComposeUtxo[];
    };
    coin: CoinSymbol;
    psbtData: string;
};

export type ComposePsbtResult = PrecomposeResultFinal & {
    version: number;
    locktime: number;
};

export declare function composePsbt(
    params: DeviceFreeParams<ComposePsbtParams>,
): Response<ComposePsbtResult>;
