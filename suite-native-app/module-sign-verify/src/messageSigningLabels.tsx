import { type ReactNode, useCallback, useMemo } from 'react';

import { Badge } from '@suite-native/atoms';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import type {
    SignAddressCategory,
    SignFormatOption,
} from '@trezor/network-module-suite-common-types';

/**
 * Native keeps its own translation catalog, so it maps the labels networks offer onto its own
 * keys by the label id. A format a family adds later shows in the family's own wording until it
 * gets a key here.
 */
const formatLabelKeys: Partial<Record<string, TxKeyPath>> = {
    TR_BIP_SIG_FORMAT: 'signAndVerify.format.values.trezor',
    TR_COMPATIBILITY_SIG_FORMAT: 'signAndVerify.format.values.electrum',
    TR_PUBLIC_KEY_RAW: 'signAndVerify.format.values.rawKey',
    TR_PUBLIC_KEY_COSE: 'signAndVerify.format.values.cose',
};

export const useMessageSigningLabels = () => {
    const { translate } = useTranslate();

    const getFormatLabel = useCallback(
        ({ label }: SignFormatOption) => {
            const labelKey = formatLabelKeys[label.id];

            return labelKey === undefined ? label.defaultMessage : translate(labelKey);
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
