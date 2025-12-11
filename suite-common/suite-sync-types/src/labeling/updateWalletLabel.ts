import type { StaticSessionId } from '@trezor/connect';

export type UpdateWalletLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    label: string | null;
};

export type UpdateWalletLabel = (params: UpdateWalletLabelParams) => void;

export type UpdateWalletLabelDep = { updateWalletLabel: UpdateWalletLabel };
