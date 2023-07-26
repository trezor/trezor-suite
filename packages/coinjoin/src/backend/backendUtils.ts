import { arrayDistinct } from '@trezor/utils';
import { deriveAddresses as deriveNewAddresses, Network } from '@trezor/utxo-lib';
import { getAddressType } from '@trezor/utxo-lib/lib/address';

import type { VinVout, PrederivedAddress } from '../types/backend';

export const isTxConfirmed = ({ blockHeight = -1 }: { blockHeight?: number }) => blockHeight > 0;

type VinVoutAddressTx = { vin: Pick<VinVout, 'addresses'>[]; vout: Pick<VinVout, 'addresses'>[] };

export const getAllTxAddresses = ({ vin, vout }: VinVoutAddressTx) =>
    vin
        .concat(vout)
        .flatMap(({ addresses = [] }) => addresses)
        .filter(arrayDistinct);

const doesAnyAddressFulfill = (
    { vin, vout }: VinVoutAddressTx,
    condition: (address: string) => boolean,
) => getAllTxAddresses({ vin, vout }).some(condition);

export const isTaprootAddress = (address: string, network: Network) =>
    getAddressType(address, network) === 'p2tr';

export const isTaprootTx = (tx: VinVoutAddressTx, network: Network) =>
    doesAnyAddressFulfill(tx, address => isTaprootAddress(address, network));

export const doesTxContainAddress = (address: string) => (tx: VinVoutAddressTx) =>
    doesAnyAddressFulfill(tx, addr => addr === address);

export const isDoublespend = (
    { vin: vinA }: { vin: VinVout[] },
    { vin: vinB }: { vin: VinVout[] },
) =>
    vinA.some(({ txid: txidA, vout: voutA = 0 }) =>
        vinB.some(({ txid: txidB, vout: voutB = 0 }) => txidA === txidB && voutA === voutB),
    );

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

// https://github.com/websockets/ws/blob/0b235e0f9b650b1bdcbdb974cbeaaaa6a0797855/lib/websocket.js#L891
export const isWsError403 = (error: Error) => error?.message === 'Unexpected server response: 403';

// Randomize identity password to reset TOR circuit for this identity
export const resetIdentityCircuit = (identity: string) => {
    const [user] = identity.split(':');
    return `${user}:${Math.random().toString(36).slice(2)}`;
};
