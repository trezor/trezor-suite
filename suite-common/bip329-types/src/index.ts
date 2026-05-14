import * as yup from 'yup';

import { type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { type EnsureWalletSuiteSyncOnErrors } from '@suite-common/suite-sync-types';
import { type Account } from '@suite-common/wallet-types';
import { type Result } from '@trezor/type-utils';

export const bip329LabelTypeValues = [
    'tx',
    'addr',
    'wallet',
    'xpub',
    'pubkey',
    'input',
    'output',
] as const;

export type Bip329LabelType = (typeof bip329LabelTypeValues)[number];

/**
 * @see https://github.com/bitcoin/bips/blob/master/bip-0329.mediawiki#user-content-Specification
 */
export const bip329LabelSchema = yup.object({
    type: yup.mixed<Bip329LabelType>().oneOf(bip329LabelTypeValues).required(),

    /**
     * The identifier for the object being labeled (e.g., txid, address, txid:vout)
     */
    ref: yup.string().required(),

    label: yup.string().defined(), // allow for empty string

    spendable: yup.boolean().optional(),
});

export type Bip329Label = yup.InferType<typeof bip329LabelSchema>;

export type Bip329ExportResult = {
    accountLabel: string | null;
    labelsToExport: Bip329Label[];
};

export type ExportBip329Params = {
    account: Account;
};

export type ExportBip329 = (params: ExportBip329Params) => Bip329ExportResult;

export type ExportBip329Dep = {
    export: ExportBip329;
};

export type ImportBip329Params = {
    account: Account;
    bip329Labels: Bip329Label[];
};

export type ImportBip329 = (
    params: ImportBip329Params,
) => Promise<Result<void, EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError>>;

export type ImportBip329Dep = {
    import: ImportBip329;
};

export type Bip329 = {
    export: ExportBip329;
    import: ImportBip329;
};

export type Bip329Dep = {
    bip329: Bip329;
};
