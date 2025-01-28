import { step } from '../../common';
import { MetadataBaseActions } from './metadataBaseActions';

export class AccountMetadataActions extends MetadataBaseActions {
    readonly addLabelButton = (accountId: string) =>
        this.page.getByTestId(`${this.getLabelTestId(accountId)}/add-label-button`);
    readonly editLabelButton = (accountId: string) =>
        this.page.getByTestId(`${this.getLabelTestId(accountId)}/edit-label-button`);
    readonly successLabel = (accountId: string) =>
        this.page.getByTestId(`${this.getLabelTestId(accountId)}/success`);
    readonly accountLabel = (accountId: string) =>
        this.page.getByTestId(`${this.getLabelTestId(accountId)}/hover-container`);

    private getLabelTestId(accountId: string): string {
        return `@metadata/accountLabel/${accountId}`;
    }

    @step()
    async editLabel(accountId: string, newLabel: string) {
        await this.accountLabel(accountId).click();
        await this.editLabelButton(accountId).click();
        await this.fillLabelInput(newLabel, { useButton: true });
    }

    @step()
    async clickAddLabelButton(accountId: string) {
        await this.accountLabel(accountId).hover();
        await this.addLabelButton(accountId).click();
    }

    @step()
    async addLabel(accountId: string, label: string) {
        await this.clickAddLabelButton(accountId);
        await this.fillLabelInput(label);
    }
}
