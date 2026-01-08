import React from 'react';
import { IntlProvider as ReactIntlProvider } from 'react-intl';

import { StoryContext } from '@storybook/react';

import enMessages from '@suite-native/intl/translations/en-US.json';

export const intlDecorator = (Story: React.FC, context: StoryContext) => (
        <ReactIntlProvider locale="en-US" messages={enMessages}>
            <Story />
        </ReactIntlProvider>
    );
