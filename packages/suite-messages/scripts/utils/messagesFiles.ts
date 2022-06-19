/* eslint-disable global-require */
import path from 'path';
import { MessagesDomain, SimpleMessagesObject } from '../../src/messages';

export type MessagesPaths = {
    translatedMessages: SimpleMessagesObject<string>;
    sourceMessages: SimpleMessagesObject<string>;
    sourceMessagesPath: string;
    unusedPathPattern: string;
};

// Currently same for all message domains, but it definitely could be more specified in future
// for connect or if we introduce better packages naming + scoping
const unusedPathPattern = '**/(suite|validation)*/**';
// possible paths:
// suite, suite-desktop, suite-web, suite-native
// 'suite-web-landing/components',
// 'suite-web-landing/pages',
// 'suite-web-landing/scripts',
// 'suite-web-landing/utils',

export const sharedMessagesFile: Omit<MessagesPaths, 'translatedMessages'> = {
    sourceMessages: require('../../src/sharedMessages.json'),
    sourceMessagesPath: path.join(__dirname, '../../src/sharedMessages.json'),
    unusedPathPattern,
} as const;

export const messageFiles: Record<MessagesDomain, MessagesPaths> = {
    web: {
        translatedMessages: require('../../translations/web/en.json'),
        sourceMessages: require('../../src/webMessages.json'),
        sourceMessagesPath: path.join(__dirname, '../../src/webMessages.json'),
        unusedPathPattern,
    },
    mobile: {
        translatedMessages: require('../../translations/mobile/en.json'),
        sourceMessages: require('../../src/mobileMessages.json'),
        sourceMessagesPath: path.join(__dirname, '../../src/mobileMessages.json'),
        unusedPathPattern,
    },
} as const;
