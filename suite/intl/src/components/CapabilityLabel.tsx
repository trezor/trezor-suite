import { useCallback } from 'react';

import { Translation } from './Translation';
import { useTranslation } from '../hooks/useTranslation';
import { type ExtendedMessageDescriptor, isTranslationKey } from '../types';

/**
 * A label a network family provides. Families reuse this catalog's ids, which
 * `CapabilityLabel.test.ts` keeps true, so a family's label is translated wherever its id is.
 */
export type CapabilityLabelDescriptor = {
    readonly id: string;
    readonly defaultMessage: string;
};

type CapabilityLabelProps = {
    label: CapabilityLabelDescriptor;
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
        (label: CapabilityLabelDescriptor) =>
            isTranslationKey(label.id) ? translationString(label.id) : label.defaultMessage,
        [translationString],
    );
};
