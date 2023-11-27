import { Page, expect as expectPlaywright } from '@playwright/test';

import { clickDataTest, waitForDataTestSelector } from '../common';

class SuiteGuide {
    async openSidePanel(window: Page) {
        await clickDataTest(window, '@guide/button-open');
        await waitForDataTestSelector(window, '@guide/panel');
    }

    async openFeedback(window: Page) {
        await clickDataTest(window, '@guide/button-feedback');
    }

    async openDesiredForm(window: Page, formType: string) {
        const bugDropdown = await window.getByTestId(`@guide/feedback/${formType}`);
        await bugDropdown.waitFor({ state: 'visible' });
        await bugDropdown.click();
    }

    async selectLocationInApp(window: Page, desiredLocation: string) {
        const suggestionDropdown = await window.getByTestId('@guide/feedback/suggestion-dropdown');
        await suggestionDropdown.waitFor({ state: 'visible' });
        await suggestionDropdown.click();
        await clickDataTest(
            window,
            `@guide/feedback/suggestion-dropdown/select/option/${desiredLocation.toLowerCase()}`,
        );
    }

    async fillInSuggestionForm(window: Page, reportText: string) {
        // stability necesity
        await window.waitForTimeout(250);
        const suggestionForm = await window.getByTestId('@guide/feedback/suggestion-form');
        await suggestionForm.fill(reportText);
    }

    async submitForm(window: Page) {
        const submitButton = await window.getByTestId('@guide/feedback/submit-button');
        await expectPlaywright(submitButton).toBeEnabled({ timeout: 20000 });
        await submitButton.click();
    }

    async sendBugreport(
        window: Page,
        {
            reportText,
            desiredLocation,
        }: {
            desiredLocation: string;
            reportText: string;
        },
    ) {
        await this.openDesiredForm(window, 'bug');
        await this.selectLocationInApp(window, desiredLocation);
        await this.fillInSuggestionForm(window, reportText);
        await this.submitForm(window);
    }
}

export const onSuiteGuide = new SuiteGuide();
