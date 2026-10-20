import type { ComponentProps } from 'react';
import type { FormattedMessage } from 'react-intl';

import { messages } from './messages';

export type Messages = typeof messages;
export type TranslationKey = keyof Messages;
export type TranslationId = Messages[keyof Messages]['id'];

export type ExtendedMessageDescriptor = Pick<
    ComponentProps<typeof FormattedMessage>,
    'defaultMessage' | 'values'
> & {
    id: TranslationKey;
};

export function isTranslationKey(key: unknown): key is TranslationKey {
    return typeof key === 'string' && Object.hasOwn(messages, key);
}
