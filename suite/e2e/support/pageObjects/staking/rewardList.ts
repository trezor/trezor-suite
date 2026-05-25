import { Locator, Page } from '@playwright/test';

import { BigNumber } from '@trezor/utils';

import { SolanaReward } from '../../../fixtures/staking/sol-staking-accounts';
import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

export class RewardsList {
    readonly rewardItems: Locator;
    readonly itemDate: Locator;
    readonly itemEpoch: Locator;
    readonly itemCryptoAmount: Locator;
    readonly itemFiatAmount: Locator;
    readonly itemsPerPage = 10;

    constructor(private readonly page: Page) {
        this.rewardItems = this.page.getByTestId('@staking/rewards-item');
        this.itemDate = this.page.getByTestId('@staking/rewards-item/date');
        this.itemEpoch = this.page.getByTestId('@staking/rewards-item/epoch');
        this.itemCryptoAmount = this.page.getByTestId('@staking/rewards-item/crypto-amount');
        this.itemFiatAmount = this.page.getByTestId('@staking/rewards-item/fiat-amount');
    }

    getRewardsFromPage = async () => await this.rewardItems.all();

    formatDate = (dateInput: string) =>
        new Date(dateInput).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

    formatSolana = (lamports: string) =>
        new BigNumber(lamports).div(1_000_000_000).decimalPlaces(9).toString();

    verifyRewardItem = async (item: Locator, reward: SolanaReward) => {
        await expect
            .soft(item.getByTestId('@staking/rewards-item/date'))
            .toHaveText(this.formatDate(reward.time));
        await expect
            .soft(item.getByTestId('@staking/rewards-item/epoch'))
            .toHaveText(`Epoch number ${reward.epoch}`);
        await expect
            .soft(item.getByTestId('@staking/rewards-item/crypto-amount'))
            .toHaveText(this.formatSolana(reward.amount));
    };

    @step()
    async checkPage(rewardsResponse: SolanaReward[], page: number) {
        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, rewardsResponse.length);
        const expectedItemsCount = endIndex - startIndex;

        const rewardItems = await this.getRewardsFromPage();
        expect(rewardItems.length).toBe(expectedItemsCount);

        // Loop through all items on the page and verify their content
        // with corresponding reward from response
        for (let i = 0; i < expectedItemsCount; i++) {
            const item = rewardItems[i];
            const expectedReward = rewardsResponse[startIndex + i];
            if (item && expectedReward) {
                await this.verifyRewardItem(item, expectedReward);
            }
        }
    }

    @step()
    async checkRewards(rewardsResponse: SolanaReward[]) {
        const pagesToCheck = Math.ceil(rewardsResponse.length / this.itemsPerPage);

        // Loops through all pages and checks rewards
        for (let page = 1; page <= pagesToCheck; page++) {
            await this.checkPage(rewardsResponse, page);
            const notLastPage = page !== pagesToCheck;
            if (notLastPage) {
                await this.page.getByTestId(`@wallet/accounts/pagination/${page + 1}`).click();
            }
        }
    }
}
