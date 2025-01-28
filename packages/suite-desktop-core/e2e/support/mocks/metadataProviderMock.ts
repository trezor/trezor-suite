import { Page } from '@playwright/test';

import { DropboxMock, GoogleMock } from '@trezor/e2e-utils';
import { encrypt } from '@trezor/suite/src/utils/suite/metadata';

import { step } from '../common';

export enum MetadataProvider {
    DROPBOX = 'dropbox',
    GOOGLE = 'google',
}

export type ProviderMocks = DropboxMock | GoogleMock;

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

export class MetadataProviderMock {
    public readonly defaultFileContent = {
        version: '1.0.0',
        accountLabel: 'already existing label',
        outputLabels: {},
        addressLabels: {},
    };

    public readonly defaultAesKey =
        'c785ef250807166bffc141960c525df97647fcc1bca57f6892ca3742ba86ed8d';

    private providerMock: ProviderMocks | undefined;

    constructor(private readonly page: Page) {}

    private getProviderMock(): ProviderMocks {
        if (!this.providerMock) {
            throw new Error('Provider mock not initialized');
        }

        return this.providerMock;
    }

    @step()
    async start(provider: MetadataProvider) {
        switch (provider) {
            case MetadataProvider.DROPBOX:
                this.providerMock = new DropboxMock();
                break;
            case MetadataProvider.GOOGLE:
                this.providerMock = new GoogleMock();
                break;
            default:
                throw new Error(`Provider ${provider} not supported`);
        }

        await this.providerMock.start();

        await this.setupWindowStubs();
    }

    /**
     * You should almost never need to call this method directly, use only after manual page reload
     */
    @step()
    async setupWindowStubs() {
        await this.page.evaluate(rerouteFetch);
        await this.page.evaluate(stubOpen);
    }

    @step()
    setNextResponse(response: Record<string, any>): void {
        this.getProviderMock().nextResponse.push(response);
    }

    @step()
    async setFileContent(file: string, content: Record<string, any> | string, aesKey: string) {
        const encrypted = await encrypt(content, aesKey);
        this.getProviderMock().setFile(file, encrypted);
    }

    @step()
    async stop() {
        await this.getProviderMock().stop();
    }
}
