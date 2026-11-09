import React from 'react';

import { IntlProviderForTests } from '@suite-native/intl';

export const intlDecorator = (Story: React.FC) => (
    <IntlProviderForTests>
        <Story />
    </IntlProviderForTests>
);
