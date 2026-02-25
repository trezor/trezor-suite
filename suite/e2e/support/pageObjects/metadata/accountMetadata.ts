import { expect } from '@playwright/test';

import { MetadataBase } from './metadataBase';
import { step } from '../../common';

export class AccountMetadata extends MetadataBase {
    readonly editLabelButton = (accountId: string) =>
        this.accountLabel(accountId).getByTestId(this.editButtonId);
    readonly deleteLabelButton = (accountId: string) =>
        this.accountLabel(accountId).getByTestId(this.deleteButtonId);
    readonly successLabel = (accountId: string) =>
        this.accountLabel(accountId).getByTestId(this.successId);
    readonly accountLabel = (accountId: string) =>
        this.page.getByTestId(`${this.getLabelTestId(accountId)}/hover-container`);

    private getLabelTestId(accountId: string): string {
        return `@metadata/accountLabel/${accountId}`;
    }

    @step()
    async changeLabel({ accountId, label }: { accountId: string; label: string }) {
        await this.clickEditLabelButton(accountId);
        await this.fillLabelInput(label, { useButton: true });
        await this.successIconIsVisible(accountId);
    }

    @step()
    async removeLabel({ accountId }: { accountId: string }) {
        await this.page.resetMousePosition();
        await expect(this.accountLabel(accountId)).toHaveText(/[A-Za-z]+/);
        await this.accountLabel(accountId).hover();
        await this.deleteLabelButton(accountId).click();
        await this.accountLabel(accountId).hover();
        await this.successIconIsVisible(accountId);
    }

    @step()
    async clickEditLabelButton(accountId: string) {
        await this.page.resetMousePosition();
        // ensure account label is loaded - test can be too fast
        await expect(this.accountLabel(accountId)).toHaveText(/[A-Za-z]+/);
        await this.accountLabel(accountId).hover();
        await this.editLabelButton(accountId).click();
    }

    @step()
    async successIconIsVisible(accountId: string) {
        await expect(this.successLabel(accountId)).toBeVisible();
        await expect(this.successLabel(accountId)).toBeHidden();
    }
}
