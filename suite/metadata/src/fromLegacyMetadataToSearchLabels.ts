import { AccountLabels, AccountOutputLabels } from '@suite-common/metadata-types';
import { SearchAccountLabels, SearchOutputLabels, TxId } from '@suite-common/transaction-search';
import { asTxTargetId } from '@suite-common/wallet-types';
import { typedObjectEntries } from '@trezor/utils';

export const fromLegacyMetadataToSearchOutputLabels = (
    outputLabels: AccountLabels['outputLabels'] = {},
): SearchOutputLabels =>
    new Map(
        typedObjectEntries(outputLabels).map(([txid, accountOutputLabels]) => [
            txid as TxId,
            new Map(
                typedObjectEntries(accountOutputLabels as AccountOutputLabels).map(
                    ([targetId, label]) => [asTxTargetId(`${targetId}`), label],
                ),
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
