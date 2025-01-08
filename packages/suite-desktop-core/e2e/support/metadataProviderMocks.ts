import { Page } from '@playwright/test';

import { DropboxMock } from '../../../e2e-utils/src/mocks/dropbox';
import { GoogleMock } from '../../../e2e-utils/src/mocks/google';
import { step } from './common';

export enum MetadataProvider {
    DROPBOX = 'dropbox',
    GOOGLE = 'google',
}

export type MetadataProviderMock = DropboxMock | GoogleMock;

const stubOpen = `
    // Override Math.random for deterministic behavior
    Math.random = () => 0.4;

    window.open = (url, target, features) => {
        console.log('Intercepted window.open call:', url);
        window.postMessage(
            { search: '?code=chicken-cho-cha&state=YYYYYYYYYY', key: 'trezor-oauth' });
    };
`;

const rerouteFetch = `
    const originalFetch = window.fetch;

    window.fetch = async (uri, options) => {
        let url;
        try {
            url = new URL(uri);
        } catch {
            const baseUrl = window.location.origin;
            uri = new URL(uri, baseUrl).href;

            return originalFetch(uri, options);
        }

        const dropboxOrigins = ['https://content.dropboxapi.com', 'https://api.dropboxapi.com'];
        const googleOrigins = ['https://www.googleapis.com', 'https://oauth2.googleapis.com'];

        if (dropboxOrigins.some(o => uri.includes(o))) {
            const modifiedUrl = url.href.replace(url.origin, 'http://localhost:30002');
            return originalFetch(modifiedUrl, options);
        }

        if (googleOrigins.some(o => uri.includes(o))) {
            const modifiedUrl = url.href.replace(url.origin, 'http://localhost:30001');
            return originalFetch(modifiedUrl, options);
        }

        return originalFetch(uri, options);
    };
`;

export class MetadataProviderMocks {
    private readonly dropBoxMock = new DropboxMock();
    private readonly googleMock = new GoogleMock();
    constructor(private readonly page: Page) {}

    getMetadataProvider(provider: MetadataProvider): MetadataProviderMock {
        switch (provider) {
            case MetadataProvider.DROPBOX:
                return this.dropBoxMock;
            case MetadataProvider.GOOGLE:
                return this.googleMock;
            default:
                throw new Error(`Provider ${provider} not supported`);
        }
    }

    @step()
    async initializeProviderMocking() {
        await this.page.evaluate(rerouteFetch);
        await this.page.evaluate(stubOpen);
    }
}
