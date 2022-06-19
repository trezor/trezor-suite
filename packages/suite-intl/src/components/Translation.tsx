import React from 'react';
import { messages, MessageId, TranslationProps, BaseTranslation } from '@suite/messages';

export const Translation = (props: TranslationProps<MessageId>) => (
    <BaseTranslation messages={messages} {...props} />
);
