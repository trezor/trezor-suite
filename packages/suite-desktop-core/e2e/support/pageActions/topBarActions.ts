import { Page } from '@playwright/test';

export class TopBarActions {
    private readonly window: Page;
    constructor(window: Page) {
        this.window = window;
    }

    async openDashboard() {
        const dashboard = this.window.getByTestId('@suite/menu/suite-index');
        await dashboard.waitFor();
        await dashboard.click();
        await this.window
            .getByTestId('@dashboard/index')
            .waitFor({ state: 'visible', timeout: 30_000 });
    }

    async openSettings() {
        const settingsBtn = this.window.getByTestId('@suite/menu/settings');
        await settingsBtn.waitFor();
        await settingsBtn.click();
        await this.window
            .getByTestId('@settings/menu/general')
            .waitFor({ state: 'visible', timeout: 30_000 });
    }
}
