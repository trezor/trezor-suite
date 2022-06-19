import mobileMessagesJson from './mobileMessages.json';
import webMessagesJson from './webMessages.json';
import sharedMessagesJson from './sharedMessages.json';
import { D } from '@mobily/ts-belt';

interface MessageDescriptor<TMessageKey extends string> {
    id: TMessageKey;
    defaultMessage: string;
}

export type MessagesObject<TMessageKey extends string> = Record<
    TMessageKey,
    MessageDescriptor<TMessageKey>
>;

export type SimpleMessagesObject<TMessageKey extends string> = Record<TMessageKey, string>;

const prepareMessages = <TMessageKey extends string>(
    simpleMessagesObject: SimpleMessagesObject<TMessageKey>,
): MessagesObject<TMessageKey> =>
    D.mapWithKey(simpleMessagesObject, (messageKey, messageValue) => ({
        id: messageKey,
        defaultMessage: messageValue,
    }));

export const messages = prepareMessages({ ...sharedMessagesJson, ...webMessagesJson });
export const mobileMessages = prepareMessages({ ...sharedMessagesJson, ...mobileMessagesJson });

export type MessageId = keyof typeof messages;
export type MobileMessageId = keyof typeof mobileMessages;

export type MessagesDomain = 'web' | 'mobile';
