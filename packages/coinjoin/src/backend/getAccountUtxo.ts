import { throwError } from '@trezor/utils';

import type { Utxo, VinVout, Transaction, AccountAddresses } from '../types/backend';

type AddressPaths = {
    [address: string]: string;
};

const isCoinbaseUtxo = (tx: Transaction) =>
    tx.details.vin.length === 1 && !tx.details.vin[0].isAddress && !tx.details.vin[0].txid;

const getHeightData = (tx: Transaction) =>
    tx.blockHeight && tx.blockHeight > 0
        ? {
              blockHeight: tx.blockHeight,
              confirmations: 1, // Correct value should be calculated from current height in caller
          }
        : {
              blockHeight: -1,
              confirmations: 0,
          };

const getAddressData = (vout: VinVout, paths: AddressPaths) => {
    const address = vout.addresses?.[0] ?? throwError('Address is missing from tx output');

    return {
        address,
        path: paths[address],
    };
};

const transformUtxo = (vout: VinVout, tx: Transaction, paths: AddressPaths): Utxo => ({
    amount: vout.value ?? throwError('Value is missing from tx output'),
    vout: vout.n,
    txid: tx.txid,
    coinbase: isCoinbaseUtxo(tx),
    ...getHeightData(tx),
    ...getAddressData(vout, paths),
});

export const getAccountUtxo = ({
    transactions,
    addresses,
}: {
    transactions: Transaction[];
    addresses?: AccountAddresses;
}): Utxo[] => {
    const paths = addresses
        ? addresses.used.concat(addresses.unused, addresses.change).reduce<AddressPaths>(
              (prev, cur) => ({
                  ...prev,
                  [cur.address]: cur.path,
              }),
              {},
          )
        : {};

    const utxos = new Map<string, [VinVout, Transaction]>();

    transactions.forEach(tx => {
        tx.details.vin
            .filter(vin => vin.isAccountOwned)
            .forEach(vin => {
                utxos.delete(`${vin.txid}-${vin.vout ?? 0}`);
            });
        tx.details.vout
            .filter(vout => vout.isAccountOwned)
            .forEach(vout => {
                utxos.set(`${tx.txid}-${vout.n}`, [vout, tx]);
            });
    });

    return Array.from(utxos.values(), ([vout, tx]) => transformUtxo(vout, tx, paths));
};
