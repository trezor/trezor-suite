import { type AccountLabels } from '@suite-common/metadata-types';
import {
    type SearchAccountLabels,
    type SearchOutputLabels,
} from '@suite-common/transaction-search';
import { asTxTargetId } from '@suite-common/wallet-types';
import { typedObjectEntries } from '@trezor/utils';

export const fromLegacyMetadataToSearchOutputLabels = (
    outputLabels: AccountLabels['outputLabels'] = {},
): SearchOutputLabels =>
    new Map(
        typedObjectEntries(outputLabels).map(([txid, accountOutputLabels]) => [
            txid,
            new Map(
                typedObjectEntries(accountOutputLabels).map(([targetId, label]) => [
                    asTxTargetId(`${targetId}`),
                    label,
                ]),
            ),
        ]),
    );

export const fromLegacyMetadataToSearchAccountLabels = (
    legacyLabels: AccountLabels,
): SearchAccountLabels => ({
    accountLabel: legacyLabels.accountLabel ?? null,
    outputLabels: fromLegacyMetadataToSearchOutputLabels(legacyLabels.outputLabels),
    addressLabels: new Map(typedObjectEntries(legacyLabels.addressLabels ?? {})),
});
