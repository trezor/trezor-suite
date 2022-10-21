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
export const fixTxInputs = (transactions: Transaction[], client: CoinjoinBackendClient) =>
    Promise.all(
        transactions
            .filter(tx => tx.details.vin.some(vin => vin.isAccountOwned))
            .map(async tx => {
                const fetched = await client.fetchTransaction(tx.txid);
                tx.details.vin.forEach(vin => {
                    if (!vin.isAccountOwned) return;
                    vin.txid = fetched.vin[vin.n].txid;
                    vin.vout = fetched.vin[vin.n].vout;
                    vin.coinbase = fetched.vin[vin.n].coinbase;
                });
            }),
    );
