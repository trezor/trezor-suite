import { type Locator, type Page } from '@playwright/test';
import type { CryptoId } from 'invity-api';

import type { NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../common';
import { expect } from '../testExtends/customMatchers';

type ReceiveAccountParams = {
    accountSymbol: NetworkSymbol;
    accountType: string;
    index: number;
};

type AssetGroup = 'my-assets' | 'all-assets';

const ASSET_TESTID_PREFIX = '@global-receive/asset/';

// A catalogue asset id is `<network>` for a coin and `<network>--<contract>` for a token.
const networkOfAssetTestId = (testId: string) =>
    testId.replace(ASSET_TESTID_PREFIX, '').split('--')[0] ?? '';

export class GlobalReceiveModal {
    readonly openButton: Locator;
    readonly modal: Locator;
    readonly description: Locator;
    readonly assetsTab: Locator;
    readonly accountsTab: Locator;
    readonly addAccountButton: Locator;
    readonly backButton: Locator;
    readonly closeButton: Locator;
    readonly noAssetsResults: Locator;
    readonly noAccountsResults: Locator;
    readonly viewAccountsLink: Locator;
    // The asset list is virtualized, so this only ever matches the rows currently rendered.
    readonly renderedAssetOptions: Locator;
    readonly assetOption = (assetCryptoId: CryptoId): Locator =>
        this.page.getByTestId(`${ASSET_TESTID_PREFIX}${assetCryptoId}`);
    readonly assetGroupLabel = (group: AssetGroup): Locator =>
        this.page.getByTestId(`@global-receive/group/${group}`);
    readonly accountOption = ({
        accountType,
        accountSymbol,
        index,
    }: ReceiveAccountParams): Locator =>
        this.page.getByTestId(`@global-receive-account/${accountType}/${accountSymbol}/${index}`);

    constructor(private readonly page: Page) {
        this.openButton = this.page.getByTestId('@wallet/menu/wallet-global-receive');
        this.modal = this.page.getByTestId('@global-receive/modal');
        this.description = this.modal.getByTestId('@modal/header-paragraph');
        this.assetsTab = this.page.getByTestId('@global-receive/tab/assets');
        this.accountsTab = this.page.getByTestId('@global-receive/tab/accounts');
        this.addAccountButton = this.page.getByTestId('@global-send-receive/add-account');
        this.backButton = this.modal.getByTestId('@modal/back-button');
        this.closeButton = this.modal.getByTestId('@modal/close-button');
        this.noAssetsResults = this.page.getByTestId('@global-receive/empty/assets');
        this.noAccountsResults = this.page.getByTestId('@global-receive/empty/accounts');
        this.viewAccountsLink = this.page.getByTestId('@global-receive/empty/view-accounts');
        this.renderedAssetOptions = this.page.getByTestId(new RegExp(`^${ASSET_TESTID_PREFIX}`));
    }

    @step()
    async open() {
        await this.openButton.click();
        await expect(this.page.modalHeader).toHaveTranslation('TR_RECEIVE');
    }

    @step()
    async goBack() {
        await this.backButton.click();
    }

    @step()
    async getRenderedAssetNetworks(): Promise<string[]> {
        const rows = await this.renderedAssetOptions.all();
        const testIds = await Promise.all(rows.map(row => row.getAttribute('data-testid')));

        return [
            ...new Set(
                testIds
                    .filter((testId): testId is string => testId !== null)
                    .map(networkOfAssetTestId)
                    .filter(network => network !== ''),
            ),
        ];
    }
}
