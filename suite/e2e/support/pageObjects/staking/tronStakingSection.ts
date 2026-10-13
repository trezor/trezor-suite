import { type Locator, type Page } from '@playwright/test';

import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

type TronStakingToastType = 'tx-staked' | 'tx-voted';

export class TronStakingSection {
    // The flow advances only after the app re-fetches the account and sees the broadcast
    // transaction confirmed; the account poll runs every few seconds.
    readonly chainConfirmationTimeout = 15_000;

    // stake flow
    readonly howItWorksButton: Locator;
    readonly stakeTitle: Locator;
    readonly freezeStep: Locator;
    readonly voteStep: Locator;
    readonly freezeAmountInput: Locator;
    readonly freezeMaxButton: Locator;
    readonly freezeAvailableBalance: Locator;
    readonly freezeResourceOption = (resource: 'bandwidth' | 'energy') =>
        this.page.getByTestId(`@staking/tron-freeze/resource-select/${resource}`);
    readonly freezeReserveLeftBanner: Locator;
    readonly freezeReserveRecommendedBanner: Locator;
    readonly freezeAmountError: Locator;
    readonly freezeContinueButton: Locator;
    readonly pendingTransactionTitle: Locator;

    // vote step
    readonly remainingVotes: Locator;
    readonly selectRepresentativesButton: Locator;
    readonly changeRepresentativesButton: Locator;
    readonly allocationRow = (address: string) =>
        this.page.getByTestId(`@staking/tron-vote/allocation-row/${address}`);
    readonly allocationRowVotes = (address: string) =>
        this.allocationRow(address).getByTestId('@staking/tron-vote/allocation-row-votes');
    readonly allocationRowVotesButton = (address: string) =>
        this.allocationRow(address).getByTestId('@staking/tron-vote/allocation-row-votes-button');
    readonly allocationRowApr = (address: string) =>
        this.allocationRow(address).getByTestId('@staking/tron-vote/allocation-row-apr');
    readonly votesToAllocateBanner: Locator;
    readonly votesExceedBanner: Locator;
    readonly voteContinueButton: Locator;

    // select representatives modal
    readonly selectRepresentativesModal: Locator;
    readonly representativeRow = (address: string) =>
        this.selectRepresentativesModal.getByTestId(
            `@staking/tron-select-representatives/row/${address}`,
        );
    readonly representativeCheckbox = (address: string) =>
        this.representativeRow(address).getByTestId(
            '@staking/tron-select-representatives/checkbox',
        );
    readonly representativeName = (address: string) =>
        this.representativeRow(address).getByTestId('@staking/tron-representative/name');
    readonly representativeAddress = (address: string) =>
        this.representativeRow(address).getByTestId('@staking/tron-representative/address');
    readonly representativeApr = (address: string) =>
        this.representativeRow(address).getByTestId('@staking/tron-select-representatives/apr');
    readonly selectRepresentativesHeading: Locator;
    readonly selectRepresentativesDescription: Locator;
    readonly selectRepresentativesConfirmButton: Locator;

    // vote consent modal
    readonly voteConsentModal: Locator;
    readonly voteConsentCheckbox: Locator;
    readonly voteConsentConfirmButton: Locator;

    // transaction review modal outputs specific to tron
    readonly reviewResource: Locator;
    readonly reviewVoteAddress: Locator;
    readonly reviewVoteCount: Locator;

    // complete screen
    readonly completeHeading: Locator;
    readonly summaryCard: Locator;
    readonly summaryApr: Locator;
    readonly summaryEarnedResource: Locator;
    readonly summarySuppliedAmount: Locator;
    readonly backToOverviewButton: Locator;

    // toasts
    // A dismissed toast stays in the DOM hidden for a while, so only visible toasts are matched.
    readonly toast = (type: TronStakingToastType) =>
        this.page.getByTestId(`@toast/${type}`).filter({ visible: true });
    readonly toastMessage = (type: TronStakingToastType) =>
        this.toast(type).getByTestId(`@toast/${type}/message`);
    readonly toastCloseButton = (type: TronStakingToastType) =>
        this.toast(type).getByTestId(`@toast/${type}/close`);

    // dashboard
    readonly stakedCard: Locator;
    readonly stakedAmount: Locator;
    readonly stakedCardApr: Locator;
    readonly stakeButton: Locator;
    readonly unstakeButton: Locator;
    readonly voteButton: Locator;
    readonly votesToAllocateButton: Locator;
    readonly remainingVotesButton: Locator;
    readonly resourcesCard: Locator;
    readonly resourceValue = (resource: 'bandwidth' | 'energy') =>
        this.page.getByTestId(`@staking/tron-resources-card/${resource}`);

    constructor(private readonly page: Page) {
        this.howItWorksButton = this.page.getByTestId('@staking/tron-header/how-it-works-button');
        this.stakeTitle = this.page.getByTestId('@staking/tron-stake/title');
        this.freezeStep = this.page.getByTestId('@staking/tron-stake/freeze-step');
        this.voteStep = this.page.getByTestId('@staking/tron-stake/vote-step');
        this.freezeAmountInput = this.page.getByTestId('@staking/tron-freeze/amount-input');
        this.freezeMaxButton = this.page.getByTestId('@staking/tron-freeze/max-button');
        this.freezeAvailableBalance = this.page.getByTestId(
            '@staking/tron-freeze/available-balance',
        );
        this.freezeReserveLeftBanner = this.page.getByTestId(
            '@staking/tron-freeze/reserve-left-banner',
        );
        this.freezeReserveRecommendedBanner = this.page.getByTestId(
            '@staking/tron-freeze/reserve-recommended-banner',
        );
        this.freezeAmountError = this.page.getByTestId('@staking/tron-freeze/amount-error');
        this.freezeContinueButton = this.page.getByTestId('@staking/tron-freeze/continue-button');
        this.pendingTransactionTitle = this.page.getByTestId('@pending-transaction/title');

        this.remainingVotes = this.page.getByTestId('@staking/tron-vote/remaining-votes');
        this.selectRepresentativesButton = this.page.getByTestId(
            '@staking/tron-vote/select-representatives-button',
        );
        this.changeRepresentativesButton = this.page.getByTestId(
            '@staking/tron-vote/change-representatives-button',
        );
        this.votesToAllocateBanner = this.page.getByTestId(
            '@staking/tron-vote/votes-to-allocate-banner',
        );
        this.votesExceedBanner = this.page.getByTestId('@staking/tron-vote/votes-exceed-banner');
        this.voteContinueButton = this.page.getByTestId('@staking/tron-vote/continue-button');

        this.selectRepresentativesModal = this.page.getByTestId(
            '@modal/tron-select-representatives',
        );
        this.selectRepresentativesConfirmButton = this.selectRepresentativesModal.getByTestId(
            '@modal/tron-select-representatives/confirm-button',
        );
        this.selectRepresentativesHeading =
            this.selectRepresentativesModal.getByTestId('@modal/header');
        this.selectRepresentativesDescription =
            this.selectRepresentativesModal.getByTestId('@modal/header-paragraph');

        this.voteConsentModal = this.page.getByTestId('@modal/tron-vote-consent');
        this.voteConsentCheckbox = this.voteConsentModal.getByTestId(
            '@modal/tron-vote-consent/checkbox',
        );
        this.voteConsentConfirmButton = this.voteConsentModal.getByTestId(
            '@modal/tron-vote-consent/confirm-button',
        );

        this.reviewResource = this.page
            .getByTestId('@modal/output-resource')
            .getByTestId('@modal/output-value');
        this.reviewVoteAddress = this.page
            .getByTestId('@modal/output-address')
            .getByTestId('@modal/output-value');
        this.reviewVoteCount = this.page
            .getByTestId('@modal/output-votes')
            .getByTestId('@modal/output-value');

        this.completeHeading = this.page.getByTestId('@staking/tron-complete/heading');
        this.summaryCard = this.page.getByTestId('@staking/tron-complete/summary-card');
        this.summaryApr = this.summaryCard.getByTestId('@staking/tron-complete/apr');
        this.summaryEarnedResource = this.summaryCard.getByTestId(
            '@staking/tron-complete/earned-resource',
        );
        this.summarySuppliedAmount = this.summaryCard.getByTestId(
            '@staking/tron-complete/supplied-amount',
        );
        this.backToOverviewButton = this.page.getByTestId(
            '@staking/tron-complete/back-to-overview-button',
        );

        this.stakedCard = this.page.getByTestId('@staking/tron-staked-card/container');
        this.stakedAmount = this.stakedCard.getByTestId('@staking/tron-staked-card/staked-amount');
        this.stakedCardApr = this.stakedCard.getByTestId('@staking/tron-staked-card/apr');
        this.stakeButton = this.stakedCard.getByTestId('@staking/tron-staked-card/stake-button');
        this.unstakeButton = this.stakedCard.getByTestId(
            '@staking/tron-staked-card/unstake-button',
        );
        this.voteButton = this.stakedCard.getByTestId('@staking/tron-staked-card/vote-button');
        this.votesToAllocateButton = this.stakedCard.getByTestId(
            '@staking/tron-staked-card/votes-to-allocate-button',
        );
        this.remainingVotesButton = this.stakedCard.getByTestId(
            '@staking/tron-staked-card/remaining-votes-button',
        );
        this.resourcesCard = this.page.getByTestId('@staking/tron-resources-card/container');
    }

    // The confirmed toast replaces the pending one for the same txid; dismissing the pending toast
    // first keeps the message locator unique.
    @step()
    async dismissToast(type: TronStakingToastType) {
        await this.toastCloseButton(type).click();
        await expect(this.toast(type)).toBeHidden();
    }
}
