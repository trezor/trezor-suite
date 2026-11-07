import { render } from '@testing-library/react';

import { IntlProviderForTests, messages } from '@suite/intl';
import { SUITE_URL } from '@trezor/urls';

import { Metadata } from './Metadata';

const getMetaContents = (attribute: 'name' | 'property', value: string) =>
    Array.from(document.head.querySelectorAll(`meta[${attribute}="${value}"]`), meta =>
        meta.getAttribute('content'),
    );

describe('Metadata', () => {
    it('sets the default title and the meta tags in the document head', () => {
        render(<Metadata />, { wrapper: IntlProviderForTests });

        const description = messages.TR_SUITE_META_DESCRIPTION.defaultMessage;
        expect(document.title).toBe('Trezor Suite');
        expect(getMetaContents('name', 'title')).toEqual(['Trezor Suite']);
        expect(getMetaContents('name', 'description')).toEqual([description]);
        expect(getMetaContents('property', 'og:type')).toEqual(['website']);
        expect(getMetaContents('property', 'og:url')).toEqual([SUITE_URL]);
        expect(getMetaContents('property', 'og:title')).toEqual(['Trezor Suite']);
        expect(getMetaContents('property', 'og:description')).toEqual([description]);
        expect(getMetaContents('property', 'twitter:card')).toEqual(['summary_large_image']);
        expect(getMetaContents('property', 'twitter:url')).toEqual([SUITE_URL]);
        expect(getMetaContents('property', 'twitter:title')).toEqual(['Trezor Suite']);
        expect(getMetaContents('property', 'twitter:description')).toEqual([description]);
    });

    it('lets the most recently mounted instance set the document title until it unmounts', () => {
        const { rerender } = render(<Metadata />, { wrapper: IntlProviderForTests });

        rerender(
            <>
                <Metadata />
                <Metadata title="Bridge | Trezor Suite" />
            </>,
        );
        expect(document.title).toBe('Bridge | Trezor Suite');

        rerender(
            <>
                <Metadata title="Trezor Suite | Updated" />
                <Metadata title="Bridge | Trezor Suite" />
            </>,
        );
        expect(document.title).toBe('Bridge | Trezor Suite');

        rerender(<Metadata title="Trezor Suite | Updated" />);
        expect(document.title).toBe('Trezor Suite | Updated');
    });

    it('removes its tags from the document head on unmount', () => {
        const { unmount } = render(<Metadata />, { wrapper: IntlProviderForTests });

        unmount();

        expect(document.head.querySelector('title')).toBeNull();
        expect(document.head.querySelector('meta')).toBeNull();
    });
});
