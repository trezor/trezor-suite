import { AccountLabels, AccountOutputLabels } from '@suite-common/metadata-types';

type SearchOutputLabels = Map<string, Map<string, string>>;

type SearchAccountLabels = {
    accountLabel?: string;
    outputLabels: SearchOutputLabels;
    addressLabels: Map<string, string>;
};

export const fromLegacyMetadataToSearchOutputLabels = (
    outputLabels: AccountLabels['outputLabels'] = {},
): SearchOutputLabels =>
    new Map(
        Object.entries(outputLabels).map(([txid, accountOutputLabels]) => [
            txid,
            new Map(
                Object.entries(accountOutputLabels as AccountOutputLabels).map(
                    ([targetId, label]) => [targetId, label],
                ),
            ),
        ]),
    );

export const fromLegacyMetadataToSearchAccountLabels = (
    legacyLabels: AccountLabels,
): SearchAccountLabels => ({
    accountLabel: legacyLabels.accountLabel,
    outputLabels: fromLegacyMetadataToSearchOutputLabels(legacyLabels.outputLabels),
    addressLabels: new Map(Object.entries(legacyLabels.addressLabels ?? {})),
});
