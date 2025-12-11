import type { StaticSessionId } from '@trezor/connect';

export type UpdateAccountLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    accountKey: string;
    label: string | null;
};

export type UpdateAccountLabel = (params: UpdateAccountLabelParams) => void;

export type UpdateAccountLabelDep = { updateAccountLabel: UpdateAccountLabel };
