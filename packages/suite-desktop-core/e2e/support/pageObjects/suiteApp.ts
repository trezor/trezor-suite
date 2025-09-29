import { Page } from '@playwright/test';

import { step } from '../common';
import { ModelFixture } from '../modelFixture';
import { DevicePrompt } from './devicePrompt';

export class SuiteApp {
    constructor(
        private readonly page: Page,
        private readonly model: ModelFixture,
        private readonly devicePrompt: DevicePrompt,
    ) {}

    @step()
    async reloadApp() {
        await this.page.reload();

        if (!this.model.isModelWithTHP()) {
            return;
        }

        await this.devicePrompt.allowConnectToTrezor();
    }
}
