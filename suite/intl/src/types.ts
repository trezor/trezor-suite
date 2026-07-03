import type { ComponentProps } from 'react';
import type { FormattedMessage } from 'react-intl';

import type { TranslationId, TranslationKey } from './generated/translationKeys';
import { messages } from './messages';

export type { TranslationId, TranslationKey };

export type Messages = Record<TranslationKey, { id: TranslationId; defaultMessage: string }>;

export type ExtendedMessageDescriptor = Pick<
    ComponentProps<typeof FormattedMessage>,
    'defaultMessage' | 'values'
> & {
    id: TranslationKey;
};

export function isTranslationKey(key: unknown): key is TranslationKey {
    return typeof key === 'string' && Object.hasOwn(messages, key);
}
