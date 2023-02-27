import { deriveAddresses as deriveNewAddresses } from '@trezor/utxo-lib';

import type { VinVout, PrederivedAddress } from '../types/backend';

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
