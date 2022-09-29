// TODO: distribute utils somewhere else

import { Account as CoinjoinAccount } from '@trezor/coinjoin';
import { Account, CoinjoinSessionParameters } from '@suite-common/wallet-types';
import { getBip43Type, getUtxoOutpoint } from '@suite-common/wallet-utils';

// convert suite account type to @trezor/coinjoin (Wasabi) account type
const getAccountType = (path: string) => {
    const bip43 = getBip43Type(path);
    switch (bip43) {
        case 'bip86':
        case 'slip25':
            return 'Taproot';
        case 'bip84':
            return 'P2WPKH';
        default:
            return 'P2WPKH';
    }
};

const getUtxos = (utxos: Account['utxo']) =>
    utxos
        ?.filter(utxo => utxo.confirmations) // TODO: filter anonymized and "out of the basket" utxos
        .forEach(utxo => ({
            ...utxo,
            outpoint: getUtxoOutpoint(utxo),
            amount: Number(utxo.amount),
        }));

// transform suite Account to @trezor/coinjoin Account
// TODO: validate and throw errors (account type, symbol)
export const sanitizeAccount = (
    account: Account,
    params: CoinjoinSessionParameters,
): CoinjoinAccount => ({
    type: getAccountType(account.path),
    symbol: account.symbol as any,
    descriptor: account.key,
    anonymityLevel: 0,
    maxRounds: params.maxRounds,
    maxFeePerKvbyte: params.maxFeePerKvbyte,
    maxCoordinatorFeeRate: params.maxCoordinatorFeeRate,
    utxos: getUtxos(account.utxo) || [],
    addresses: account.addresses!.change,
});
