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

const ASSET_LIST_SCROLL_STEP = 400;
const ASSET_LIST_SCROLL_STEPS = 12;

export class GlobalReceiveModal {
    readonly openButton: Locator;
    readonly modal: Locator;
    readonly description: Locator;
    readonly assetsTab: Locator;
    readonly accountsTab: Locator;
    readonly addAccountButton: Locator;
    readonly backButton: Locator;
    readonly closeButton: Locator;
    readonly assetList: Locator;
    readonly noAssetsResults: Locator;
    readonly noAccountsResults: Locator;
    readonly viewAccountsLink: Locator;
    // The asset list is virtualized, so this only matches the rows rendered right now.
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
        // The virtualized list has no testid of its own, so it is reached through the modal.
        this.assetList = this.modal.locator('[data-component="VirtualizedList"]');
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

    private async getRenderedAssetIds(): Promise<string[]> {
        const rows = await this.renderedAssetOptions.all();
        const testIds = await Promise.all(rows.map(row => row.getAttribute('data-testid')));

        return testIds
            .filter((testId): testId is string => testId !== null)
            .map(testId => testId.replace(ASSET_TESTID_PREFIX, ''));
    }

    /**
     * Scrolls the asset list from the top and returns which of `expectedIds` it rendered along the
     * way. Stops as soon as all of them are found, so it never walks the whole catalogue.
     */
    @step()
    async collectAssetIdsWhileScrolling(expectedIds: readonly string[]): Promise<string[]> {
        const remaining = new Set(expectedIds);
        const found: string[] = [];

        for (let index = 0; index <= ASSET_LIST_SCROLL_STEPS && remaining.size > 0; index++) {
            if (index > 0) {
                const scrollTop = index * ASSET_LIST_SCROLL_STEP;
                await this.assetList.evaluate((element, top) => {
                    element.scrollTop = top;
                }, scrollTop);
                await expect
                    .poll(() => this.assetList.evaluate(element => element.scrollTop))
                    .toBeGreaterThanOrEqual(scrollTop);
            }

            for (const id of await this.getRenderedAssetIds()) {
                if (remaining.delete(id)) {
                    found.push(id);
                }
            }
        }

        return found;
    }
}
