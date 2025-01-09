import { Page } from '@playwright/test';

export class IndexedDbFixture {
    constructor(private page: Page) {}

    async reset() {
        await this.page.evaluate(
            () =>
                new Promise<void>((resolve, reject) => {
                    const request = indexedDB.deleteDatabase('trezor-suite');

                    request.onsuccess = () => {
                        resolve();
                    };

                    request.onerror = () => {
                        reject('Error resetting database');
                    };
                }),
        );
    }
}
