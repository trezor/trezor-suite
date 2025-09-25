import { Page } from '@playwright/test';

import { step } from '../common';
import { ModelFixture } from '../modelFixture';
import { OnboardingPage } from './onboarding/onboardingPage';

export class SuiteApp {
    constructor(
        private readonly page: Page,
        private readonly model: ModelFixture,
        private readonly onboardingPage: OnboardingPage,
    ) {}

    @step()
    async reloadApp() {
        await this.page.reload();

        if (!this.model.isModelWithTHP()) {
            return;
        }

        await this.onboardingPage.allowConnectToTrezor();
    }
}
