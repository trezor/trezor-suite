import { type ReactNode, useCallback, useMemo } from 'react';

import { Badge } from '@suite-native/atoms';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import type {
    SignAddressCategory,
    SignFormatId,
    SignFormatKind,
    SignFormatOption,
} from '@trezor/network-module-suite-common-types';

/**
 * Native keeps its own translation catalog, so it maps what a network offers onto its own keys.
 * The tables are exhaustive: a new format or address category does not compile until it is mapped.
 */
const formatLabelKeys = {
    signature: {
        default: 'signAndVerify.format.values.trezor',
        electrum: 'signAndVerify.format.values.electrum',
        cose: null,
    },
    publicKey: {
        default: 'signAndVerify.format.values.rawKey',
        electrum: null,
        cose: 'signAndVerify.format.values.cose',
    },
} as const satisfies Record<SignFormatKind, Record<SignFormatId, TxKeyPath | null>>;

export const useMessageSigningLabels = () => {
    const { translate } = useTranslate();

    const getFormatLabel = useCallback(
        (kind: SignFormatKind, { format, label }: SignFormatOption) => {
            const formatId: SignFormatId = format;
            const labelKey = formatLabelKeys[kind][formatId];

            // A pairing the table marks as impossible still renders, with the family's own wording.
            return labelKey === null ? label.defaultMessage : translate(labelKey);
        },
        [translate],
    );

    const addressBadges = useMemo(
        (): Record<SignAddressCategory, ReactNode> => ({
            account: null,
            staking: (
                <Badge label={translate('signAndVerify.address.badges.stake')} intent="info" />
            ),
            fresh: <Badge label={translate('signAndVerify.address.badges.fresh')} intent="brand" />,
            used: null,
            change: <Badge label={translate('signAndVerify.address.badges.change')} />,
        }),
        [translate],
    );

    return { getFormatLabel, addressBadges };
};
