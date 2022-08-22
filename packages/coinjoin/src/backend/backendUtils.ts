import type { VinVout } from '@trezor/blockchain-link/lib/types/blockbook';

export const isTxConfirmed = ({ blockHeight = -1 }: { blockHeight?: number }) => blockHeight > 0;

export const doesTxContainAddress =
    (address: string) =>
    ({ vin, vout }: { vin: VinVout[]; vout: VinVout[] }) =>
        vin
            .concat(vout)
            .flatMap(({ addresses = [] }) => addresses)
            .includes(address);
