import type { CoinjoinBackendClient } from './CoinjoinBackendClient';
import type { VinVout, Transaction } from '../types/backend';

export const isTxConfirmed = ({ blockHeight = -1 }: { blockHeight?: number }) => blockHeight > 0;

export const doesTxContainAddress =
    (address: string) =>
    ({ vin, vout }: { vin: VinVout[]; vout: VinVout[] }) =>
        vin
            .concat(vout)
            .flatMap(({ addresses = [] }) => addresses)
            .includes(address);

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
