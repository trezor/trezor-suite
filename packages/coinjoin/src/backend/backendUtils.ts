import BigNumber from 'bignumber.js';

import { deriveAddresses as deriveNewAddresses } from '@trezor/utxo-lib';

import type { CoinjoinBackendClient } from './CoinjoinBackendClient';
import type { VinVout, Transaction, PrederivedAddress } from '../types/backend';

export const isTxConfirmed = ({ blockHeight = -1 }: { blockHeight?: number }) => blockHeight > 0;

export const doesTxContainAddress =
    (address: string) =>
    ({ vin, vout }: { vin: VinVout[]; vout: VinVout[] }) =>
        vin
            .concat(vout)
            .flatMap(({ addresses = [] }) => addresses)
            .includes(address);

export const deriveAddresses = (
    prederived: PrederivedAddress[] = [],
    ...[descriptor, type, from, count, network]: Parameters<typeof deriveNewAddresses>
) => {
    const fromPrederived = Math.min(from, prederived.length);
    const countPrederived = Math.min(prederived.length - fromPrederived, count);
    const fromNew = Math.max(from, prederived.length);
    const countNew = Math.max(count - countPrederived, 0);

    const derived = countNew
        ? deriveNewAddresses(descriptor, type, fromNew, countNew, network)
        : [];
    return prederived.slice(fromPrederived, fromPrederived + countPrederived).concat(derived);
};

/** @deprecated Temporary workaround, should be removed before releasing */
export const fixTx = (transactions: Transaction[], client: CoinjoinBackendClient) =>
    Promise.all(
        transactions.map(async tx => {
            const fetched = await client.fetchTransaction(tx.txid);
            // tx.vsize missing in transactions from /block endpoint
            tx.feeRate = fetched.vsize
                ? new BigNumber(tx.fee).div(fetched.vsize).decimalPlaces(2).toString()
                : undefined;
            // tx.size and tx.hex missing in transactions from /block endpoint
            tx.details.size =
                fetched.size || typeof fetched.hex === 'string' ? fetched.hex.length / 2 : 0;
            // vin.vout a vin.txid missing in transctions from /block endpoint
            tx.details.vin.forEach(vin => {
                if (!vin.isAccountOwned) return;
                vin.txid = fetched.vin[vin.n].txid;
                vin.vout = fetched.vin[vin.n].vout;
                vin.coinbase = fetched.vin[vin.n].coinbase;
            });
        }),
    );
