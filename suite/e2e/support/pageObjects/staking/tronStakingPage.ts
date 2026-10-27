import { Locator, Page } from '@playwright/test';

import type { TronResourceType } from '@suite-common/wallet-types';
import { Model } from '@trezor/trezor-user-env-link';

import { step } from '../../common';
import { DeviceFixture } from '../../device';
import { expect } from '../../testExtends/customMatchers';
import { DevicePrompt } from '../devicePrompt';

const RESOURCE_DEVICE_LABEL = {
    bandwidth: 'Bandwidth',
    energy: 'Energy',
} as const satisfies Record<TronResourceType, string>;

const CLAIM_DEVICE_QUESTION = {
    unfrozenBalance: 'Claim unfrozen balance?',
    votingRewards: 'Claim voting rewards?',
} as const;

type ConfirmResourceOperationOnDeviceParams = {
    ownerAddress: string;
    amount: number;
    resource: TronResourceType;
};

export class TronStakingPage {
    readonly transactionConfirmationTimeout = 30_000;
    readonly stakeConsentModal: Locator;
    readonly stakeConsentCheckbox: Locator;
    readonly stakeConsentConfirmButton: Locator;
    readonly rewardsCard: Locator;
    readonly rewardsCardAmount: Locator;
    readonly rewardsCardClaimButton: Locator;
    readonly withdrawBanner: Locator;
    readonly withdrawBannerButton: Locator;
    readonly stakedCard: Locator;
    readonly stakedCardUnstakeButton: Locator;
    readonly stakedCardVoteButton: Locator;
    readonly stakeTitle: Locator;
    readonly freezeAmountInput: Locator;
    readonly freezeContinueButton: Locator;
    readonly selectRepresentativesButton: Locator;
    readonly changeRepresentativesButton: Locator;
    readonly selectRepresentativesModal: Locator;
    readonly selectRepresentativesConfirmButton: Locator;
    readonly representativeCheckbox = (address: string) =>
        this.selectRepresentativesModal
            .getByTestId(`@staking/tron-select-representatives/row/${address}`)
            .getByTestId('@staking/tron-select-representatives/checkbox');
    readonly allocationRowVotes = (address: string) =>
        this.page
            .getByTestId(`@staking/tron-vote/allocation-row/${address}`)
            .getByTestId('@staking/tron-vote/allocation-row-votes-button');
    readonly voteContinueButton: Locator;
    readonly voteConsentModal: Locator;
    readonly voteConsentCheckbox: Locator;
    readonly voteConsentConfirmButton: Locator;
    readonly unstakeTitle: Locator;
    readonly unstakeAmountInput: Locator;
    readonly unstakeContinueButton: Locator;
    readonly withdrawTitle: Locator;
    readonly withdrawAmount: Locator;
    readonly withdrawContinueButton: Locator;
    readonly claimTitle: Locator;
    readonly claimAmount: Locator;
    readonly claimContinueButton: Locator;
    readonly completeHeading: Locator;
    readonly completeSummaryCard: Locator;
    readonly completeSuppliedAmount: Locator;
    readonly completeUnstakedAmount: Locator;
    readonly completeWithdrawnAmount: Locator;
    readonly completeClaimedAmount: Locator;
    readonly completeVoteAllocations: Locator;
    readonly completeVoteAllocationVotes = (address: string) =>
        this.completeVoteAllocations
            .getByTestId(`@staking/tron-vote/allocation-row/${address}`)
            .getByTestId('@staking/tron-vote/allocation-row-votes');

    constructor(
        private readonly page: Page,
        private readonly device: DeviceFixture,
        private readonly devicePrompt: DevicePrompt,
    ) {
        this.stakeConsentModal = this.page.getByTestId('@modal/tron-stake-consent');
        this.stakeConsentCheckbox = this.stakeConsentModal.getByTestId(
            '@modal/tron-stake-consent/checkbox',
        );
        this.stakeConsentConfirmButton = this.stakeConsentModal.getByTestId(
            '@modal/tron-stake-consent/confirm-button',
        );
        this.rewardsCard = this.page.getByTestId('@staking/tron-rewards-card/container');
        this.rewardsCardAmount = this.rewardsCard.getByTestId('@staking/tron-rewards-card/amount');
        this.rewardsCardClaimButton = this.rewardsCard.getByTestId(
            '@staking/tron-rewards-card/claim-button',
        );
        this.withdrawBanner = this.page.getByTestId('@staking/tron-withdraw-banner/container');
        this.withdrawBannerButton = this.withdrawBanner.getByTestId(
            '@staking/tron-withdraw-banner/withdraw-button',
        );
        this.stakedCard = this.page.getByTestId('@staking/tron-staked-card/container');
        this.stakedCardUnstakeButton = this.stakedCard.getByTestId(
            '@staking/tron-staked-card/unstake-button',
        );
        this.stakedCardVoteButton = this.stakedCard.getByTestId(
            '@staking/tron-staked-card/vote-button',
        );
        this.stakeTitle = this.page.getByTestId('@staking/tron-stake/title');
        this.freezeAmountInput = this.page.getByTestId('@staking/tron-freeze/amount-input');
        this.freezeContinueButton = this.page.getByTestId('@staking/tron-freeze/continue-button');
        this.selectRepresentativesButton = this.page.getByTestId(
            '@staking/tron-vote/select-representatives-button',
        );
        this.changeRepresentativesButton = this.page.getByTestId(
            '@staking/tron-vote/change-representatives-button',
        );
        this.selectRepresentativesModal = this.page.getByTestId(
            '@modal/tron-select-representatives',
        );
        this.selectRepresentativesConfirmButton = this.selectRepresentativesModal.getByTestId(
            '@modal/tron-select-representatives/confirm-button',
        );
        this.voteContinueButton = this.page.getByTestId('@staking/tron-vote/continue-button');
        this.voteConsentModal = this.page.getByTestId('@modal/tron-vote-consent');
        this.voteConsentCheckbox = this.voteConsentModal.getByTestId(
            '@modal/tron-vote-consent/checkbox',
        );
        this.voteConsentConfirmButton = this.voteConsentModal.getByTestId(
            '@modal/tron-vote-consent/confirm-button',
        );
        this.unstakeTitle = this.page.getByTestId('@staking/tron-unstake/title');
        this.unstakeAmountInput = this.page.getByTestId('@staking/tron-unstake/amount-input');
        this.unstakeContinueButton = this.page.getByTestId('@staking/tron-unstake/continue-button');
        this.withdrawTitle = this.page.getByTestId('@staking/tron-withdraw/title');
        this.withdrawAmount = this.page.getByTestId('@staking/tron-withdraw/amount');
        this.withdrawContinueButton = this.page.getByTestId(
            '@staking/tron-withdraw/continue-button',
        );
        this.claimTitle = this.page.getByTestId('@staking/tron-claim/title');
        this.claimAmount = this.page.getByTestId('@staking/tron-claim/amount');
        this.claimContinueButton = this.page.getByTestId('@staking/tron-claim/continue-button');
        this.completeHeading = this.page.getByTestId('@staking/tron-complete/heading');
        this.completeSummaryCard = this.page.getByTestId('@staking/tron-complete/summary-card');
        this.completeSuppliedAmount = this.completeSummaryCard.getByTestId(
            '@staking/tron-complete/supplied-amount',
        );
        this.completeUnstakedAmount = this.completeSummaryCard.getByTestId(
            '@staking/tron-complete/unstaked-amount',
        );
        this.completeWithdrawnAmount = this.completeSummaryCard.getByTestId(
            '@staking/tron-complete/withdrawn-amount',
        );
        this.completeClaimedAmount = this.completeSummaryCard.getByTestId(
            '@staking/tron-complete/claimed-amount',
        );
        this.completeVoteAllocations = this.page.getByTestId(
            '@staking/tron-complete/vote-allocations',
        );
    }

    @step()
    async acceptStakeConsent() {
        await this.stakeConsentCheckbox.click();
        await this.stakeConsentConfirmButton.click();
        await expect(this.stakeConsentModal).toBeHidden();
    }

    @step()
    async toggleRepresentatives(addresses: string[]) {
        for (const address of addresses) {
            await this.representativeCheckbox(address).click();
        }
        await this.selectRepresentativesConfirmButton.click();
        await expect(this.selectRepresentativesModal).toBeHidden();
    }

    @step()
    async acceptVoteConsent() {
        await this.voteConsentCheckbox.click();
        await this.voteConsentConfirmButton.click();
        await expect(this.voteConsentModal).toBeHidden();
    }

    @step()
    async confirmResourceOperationOnDevice({
        ownerAddress,
        amount,
        resource,
    }: ConfirmResourceOperationOnDeviceParams) {
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await this.device.expectToContainOnDisplay(ownerAddress.slice(0, 4));
        await this.devicePrompt.waitForPromptAndConfirm();
        await this.device.expectToContainOnDisplay(`${amount} TRX`);
        await this.device.expectToContainOnDisplay(RESOURCE_DEVICE_LABEL[resource]);
        await this.confirmHoldOnDevice();
    }

    @step()
    async confirmVotesOnDevice(totalVotes: number) {
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await this.device.expectToContainOnDisplay('Votes');
        await this.device.expectToContainOnDisplay(String(totalVotes));
        await this.confirmHoldOnDevice();
    }

    @step()
    async confirmClaimOnDevice(claim: keyof typeof CLAIM_DEVICE_QUESTION) {
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await this.device.expectToContainOnDisplay(CLAIM_DEVICE_QUESTION[claim]);
        await this.confirmHoldOnDevice();
    }

    private async confirmHoldOnDevice() {
        if (this.device.model === Model.T3T1) {
            await this.devicePrompt.waitForPromptAndClick();
        }
        await this.devicePrompt.waitForFinalPromptAndConfirm();
    }
}
