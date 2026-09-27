import { type ComponentProps, type ReactNode, isValidElement } from 'react';

import { type Translate, Translation } from '@suite-native/intl';

type NativeTranslationValues = Record<string, string | number | boolean | Date | null | undefined>;

const isNativeTranslationValues = (
    values: Record<string, unknown> | undefined,
): values is NativeTranslationValues | undefined =>
    values === undefined ||
    Object.values(values).every(
        value =>
            value === null ||
            value === undefined ||
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            value instanceof Date,
    );

type GetNativeTextLabelParams = {
    label: ReactNode;
    translate: Translate;
};

export const getNativeTextLabel = ({
    label,
    translate,
}: GetNativeTextLabelParams): string | null => {
    if (typeof label === 'string' || typeof label === 'number') {
        return String(label);
    }

    if (
        isValidElement<ComponentProps<typeof Translation>>(label) &&
        label.type === Translation &&
        label.props.children === undefined &&
        isNativeTranslationValues(label.props.values)
    ) {
        return translate(label.props.id, label.props.values);
    }

    return null;
};
