/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react';

import { QueryClient, QueryClientProvider } from '@suite-common/react-query';

import { IntlProvider } from './IntlProvider';
import { Translation } from './Translation';

type RenderTranslationParams = { showTranslationKeys: boolean };

const renderTranslation = ({ showTranslationKeys }: RenderTranslationParams) =>
    render(
        <QueryClientProvider client={new QueryClient()}>
            <IntlProvider locale="en-US" showTranslationKeys={showTranslationKeys}>
                <Translation id="TR_CANCEL" />
            </IntlProvider>
        </QueryClientProvider>,
    );

describe(IntlProvider.name, () => {
    it('renders the message from the catalog of the given locale', () => {
        renderTranslation({ showTranslationKeys: false });

        expect(screen.getByText('Cancel')).toBeDefined();
    });

    it('renders the message id instead when showTranslationKeys is set', () => {
        renderTranslation({ showTranslationKeys: true });

        expect(screen.getByText('TR_CANCEL')).toBeDefined();
    });
});
