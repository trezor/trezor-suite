import mobileMessagesJson from './mobileMessages.json';
import webMessagesJson from './webMessages.json';
import sharedMessagesJson from './sharedMessages.json';
import { D } from '@mobily/ts-belt';

interface MessageDescriptor<TMessageKey extends string> {
    id: TMessageKey;
    defaultMessage: string;
}

const prepareMessages = <TMessageKey extends string>(
    simpleMessagesObject: Record<TMessageKey, string>,
): Record<TMessageKey, MessageDescriptor<TMessageKey>> =>
    D.mapWithKey(simpleMessagesObject, (messageKey: TMessageKey, messageValue) => ({
        id: messageKey,
        defaultMessage: messageValue,
    }));

export const messages = prepareMessages({ ...sharedMessagesJson, ...webMessagesJson });
export const mobileMessages = prepareMessages({ ...sharedMessagesJson, ...mobileMessagesJson });

export type MessageId = keyof typeof messages;
export type MobileMessageId = keyof typeof mobileMessages;
