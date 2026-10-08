/** @jest-environment jsdom */

import { act, renderHook, waitFor } from '@testing-library/react';

import csMessages from '@suite/app-assets/files/translations/cs-CZ.json';
import deMessages from '@suite/app-assets/files/translations/de-DE.json';
import enMessages from '@suite/app-assets/files/translations/en-US.json';
import { QueryClient, QueryClientProvider } from '@suite-common/react-query';
import type { Locale } from '@suite-common/suite-types';

import { type IntlMessages, useIntlMessages } from './useIntlMessages';

describe(useIntlMessages.name, () => {
    type Props = { locale: Locale };

    // Records the catalog of every render, so a wasted render or a stale catalog shows up.
    const renderUseIntlMessages = (locale: Locale) => {
        const renderedMessages: IntlMessages[] = [];
        const initialProps: Props = { locale };
        const queryClient = new QueryClient();
        const rendered = renderHook(
            (props: Props) => {
                const messages = useIntlMessages(props.locale);
                renderedMessages.push(messages);

                return messages;
            },
            {
                initialProps,
                wrapper: ({ children }) => (
                    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
                ),
            },
        );

        return { ...rendered, renderedMessages };
    };

    it('renders the bundled English catalog in the first and only render', async () => {
        const { result, renderedMessages } = renderUseIntlMessages('en-US');

        expect(result.current).toBe(enMessages);

        // Give a deferred state update the chance to schedule a second render.
        await act(async () => {});

        expect(renderedMessages).toHaveLength(1);
    });

    it('shows English until the localized catalog loads, then merges it over English', async () => {
        const { result, renderedMessages } = renderUseIntlMessages('cs-CZ');

        expect(result.current).toBe(enMessages);

        await waitFor(() => expect(result.current).not.toBe(enMessages));

        expect(result.current).toStrictEqual({ ...enMessages, ...csMessages });
        expect(renderedMessages).toHaveLength(2);
    });

    it('switches back to the bundled English catalog without loading anything', async () => {
        const { result, rerender } = renderUseIntlMessages('cs-CZ');
        await waitFor(() => expect(result.current).not.toBe(enMessages));

        rerender({ locale: 'en-US' });

        expect(result.current).toBe(enMessages);
    });

    it('keeps a loaded catalog, so switching back to its locale is immediate', async () => {
        const { result, rerender } = renderUseIntlMessages('cs-CZ');
        await waitFor(() => expect(result.current).not.toBe(enMessages));
        const loadedCsMessages = result.current;

        rerender({ locale: 'en-US' });
        rerender({ locale: 'cs-CZ' });

        expect(result.current).toBe(loadedCsMessages);
    });

    it('keeps the current catalog on screen while the next locale loads', async () => {
        const { result, rerender, renderedMessages } = renderUseIntlMessages('cs-CZ');
        await waitFor(() => expect(result.current).not.toBe(enMessages));
        const loadedCsMessages = result.current;
        const rendersBeforeSwitch = renderedMessages.length;

        rerender({ locale: 'de-DE' });

        expect(result.current).toBe(loadedCsMessages);

        await waitFor(() => expect(result.current).not.toBe(loadedCsMessages));

        expect(result.current).toStrictEqual({ ...enMessages, ...deMessages });
        expect(renderedMessages.slice(rendersBeforeSwitch)).not.toContain(enMessages);
    });

    it('ignores the catalog of a locale that was replaced while it was loading', async () => {
        const { result, rerender, renderedMessages } = renderUseIntlMessages('cs-CZ');

        rerender({ locale: 'de-DE' });
        await waitFor(() => expect(result.current).not.toBe(enMessages));

        expect(result.current).toStrictEqual({ ...enMessages, ...deMessages });
        expect(renderedMessages).not.toContainEqual({ ...enMessages, ...csMessages });
    });
});
