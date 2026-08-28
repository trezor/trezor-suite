import { type ImportBip329 } from '@suite-common/bip329-types';
import {
    type UpdateAddressLabelDep,
    type UpdateOutputLabelDep,
} from '@suite-common/suite-sync-types';
import { exhaustive, ok } from '@trezor/type-utils';

export type ImportBip329ToSuiteSyncDep = {
    importBip329ToSuiteSync: ImportBip329;
};

export type Bip329ToSuiteSyncDeps = UpdateAddressLabelDep & UpdateOutputLabelDep;

export const createBip329ToSuiteSync =
    (deps: Bip329ToSuiteSyncDeps): ImportBip329 =>
    async ({ deviceStaticSessionId, accountDescriptor, bip329Labels }) => {
        for (const label of bip329Labels) {
            switch (label.type) {
                case 'output': {
                    const [txId, txTargetId] = label.ref.split(':') ?? [];

                    if (!txId || !txTargetId) {
                        break;
                    }

                    const result = await deps.updateOutputLabel({
                        txId,
                        txTargetId,
                        label: label.label ?? null,
                        networkSymbol: 'btc',
                        deviceStaticSessionId,
                        accountDescriptor,
                    });

                    if (!result.success) {
                        return result;
                    }

                    break;
                }

                case 'addr': {
                    const result = await deps.updateAddressLabel({
                        address: label.ref,
                        label: label.label ?? null,
                        networkSymbol: 'btc',
                        deviceStaticSessionId,
                        accountDescriptor,
                    });

                    if (!result.success) {
                        return result;
                    }

                    break;
                }

                case 'tx':
                case 'wallet':
                case 'xpub':
                case 'pubkey':
                case 'input':
                    break;

                default:
                    return exhaustive(label.type);
            }
        }

        return ok();
    };
