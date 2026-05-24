import { type GetVtxosFilter, type IReadonlyWallet } from '@arkade-os/sdk';

type GetArkWalletVtxosParams = {
    wallet: IReadonlyWallet;
    filter?: GetVtxosFilter;
};

// This returns the list of VTXOs as exposed by the SDK. Each VTXO carries
// lifecycle predicates (`isSpendable`, `isRecoverable`, `isExpired`,
// `isSubdust`) the history view uses to bucket entries.
export const getArkWalletVtxos = ({ wallet, filter }: GetArkWalletVtxosParams) =>
    wallet.getVtxos(filter);
