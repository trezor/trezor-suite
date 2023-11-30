import { Page } from '@playwright/test';

class TopBarActions {
    async openDashboard(window: Page) {
        const dashboard = window.getByTestId('@suite/menu/suite-index');
        await dashboard.waitFor();
        await dashboard.click();
        await window.getByTestId('@dashboard/index').waitFor({ state: 'visible', timeout: 30_000 });
    }

    async openSettings(window: Page) {
        const settingsBtn = window.getByTestId('@suite/menu/settings');
        await settingsBtn.waitFor();
        await settingsBtn.click();
        await window
            .getByTestId('@settings/menu/general')
            .waitFor({ state: 'visible', timeout: 30_000 });
    }
}

export const onTopBar = new TopBarActions();
