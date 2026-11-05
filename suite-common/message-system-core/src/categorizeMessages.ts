import type { Message } from '@suite-common/suite-types';

import type { ValidMessages } from './types';

export const categorizeMessages = (messages: Message[]): ValidMessages => {
    const validMessages: ValidMessages = {
        banner: [],
        modal: [],
        context: [],
        feature: [],
    };

    messages.forEach(message => {
        const { category } = message;

        if (typeof category === 'string') {
            // can be just one category
            validMessages[category]?.push(message.id);
        } else if (Array.isArray(category)) {
            // also can be array of categories
            category.forEach(categoryKey => validMessages[categoryKey]?.push(message.id));
        }
    });

    return validMessages;
};
