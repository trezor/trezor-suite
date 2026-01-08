import React from 'react';
import { IntlProvider as ReactIntlProvider } from 'react-intl';

import enMessages from '@suite-native/intl/translations/en-US.json';

export const intlDecorator = (Story: React.FC) => (
    <ReactIntlProvider locale="en-US" messages={enMessages}>
        <Story />
    </ReactIntlProvider>
);
