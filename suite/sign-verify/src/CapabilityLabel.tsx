import { useCallback } from 'react';

import {
    type ExtendedMessageDescriptor,
    Translation,
    type TranslationKey,
    messages,
    useTranslation,
} from '@suite-lego/intl';
import type { Label } from '@trezor/network-module-suite-common-types';

/** Families reuse this catalog's ids, which `CapabilityLabel.test.ts` keeps true. */
export const isTranslationKey = (id: string): id is TranslationKey => Object.hasOwn(messages, id);

type CapabilityLabelProps = {
    label: Label;
    values?: ExtendedMessageDescriptor['values'];
};

/** Renders a label a network family provides, translated wherever its id is in the catalog. */
export const CapabilityLabel = ({ label, values }: CapabilityLabelProps) =>
    isTranslationKey(label.id) ? (
        <Translation id={label.id} values={values} />
    ) : (
        <>{label.defaultMessage}</>
    );

export const useCapabilityLabelText = () => {
    const { translationString } = useTranslation();

    return useCallback(
        (label: Label) =>
            isTranslationKey(label.id) ? translationString(label.id) : label.defaultMessage,
        [translationString],
    );
};
