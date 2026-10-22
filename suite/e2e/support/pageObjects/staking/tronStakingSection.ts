import { type Locator, type Page } from '@playwright/test';

import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

type TronStakingToastType = 'tx-staked' | 'tx-unstaked';

export class TronStakingSection {
    // The flow advances only after the app re-fetches the account and sees the broadcast
    // transaction confirmed; the account poll runs every few seconds.
    readonly chainConfirmationTimeout = 15_000;

    // stake flow
    readonly howItWorksButton: Locator;
    readonly stakeTitle: Locator;
    readonly freezeStep: Locator;
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

    // unstake flow
    readonly unstakeTitle: Locator;
    readonly unstakeResourceOption = (resource: 'bandwidth' | 'energy') =>
        this.page.getByTestId(`@staking/tron-unstake/resource-select/${resource}`);
    readonly unstakeAmountInput: Locator;
    readonly unstakeMaxButton: Locator;
    readonly unstakeStakedBalanceAmount: Locator;
    readonly unstakeAmountError: Locator;
    readonly unstakeResourceReduction: Locator;
    readonly unstakeResourceChange: Locator;
    readonly unstakeContinueButton: Locator;

    // vote step
    readonly remainingVotes: Locator;
    readonly selectRepresentativesButton: Locator;
    readonly allocationRow = (address: string) =>
        this.page.getByTestId(`@staking/tron-vote/allocation-row/${address}`);
    readonly allocationRowName = (address: string) =>
        this.allocationRow(address).getByTestId('@staking/tron-representative/name');
    readonly allocationRowVotes = (address: string) =>
        this.allocationRow(address).getByTestId('@staking/tron-vote/allocation-row-votes');
    readonly allocationRowVotesButton = (address: string) =>
        this.allocationRow(address).getByTestId('@staking/tron-vote/allocation-row-votes-button');
    readonly allocationRowApr = (address: string) =>
        this.allocationRow(address).getByTestId('@staking/tron-vote/allocation-row-apr');
    readonly votesToAllocateBanner: Locator;
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

    // stake consent modal
    readonly stakeConsentModal: Locator;
    readonly stakeConsentHeading: Locator;
    readonly stakeConsentDescription: Locator;
    readonly stakeConsentCheckbox: Locator;
    readonly stakeConsentConfirmButton: Locator;

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
    readonly completeDescription: Locator;
    readonly summaryCard: Locator;
    readonly summaryEarnedResource: Locator;
    readonly summarySuppliedAmount: Locator;
    readonly summaryUnstakedAmount: Locator;
    readonly summaryResourceReduction: Locator;
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
    readonly resourcesCard: Locator;
    readonly unstakingCard: Locator;
    readonly unstakingRow = (index: number) =>
        this.unstakingCard.getByTestId(`@staking/tron-unstaking-card/row-${index}`);
    readonly unstakingRowLocked = (index: number) =>
        this.unstakingRow(index).getByTestId(`@staking/tron-unstaking-card/row-${index}/locked`);
    readonly unstakingRowAmount = (index: number) =>
        this.unstakingRow(index).getByTestId(`@staking/tron-unstaking-card/row-${index}/amount`);
    readonly withdrawReadyBanner: Locator;
    readonly resourceValue = (resource: 'bandwidth' | 'energy') =>
        this.page.getByTestId(`@staking/tron-resources-card/${resource}`);

    constructor(private readonly page: Page) {
        this.howItWorksButton = this.page.getByTestId('@staking/tron-header/how-it-works-button');
        this.stakeTitle = this.page.getByTestId('@staking/tron-stake/title');
        this.freezeStep = this.page.getByTestId('@staking/tron-stake/freeze-step');
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

        this.unstakeTitle = this.page.getByTestId('@staking/tron-unstake/title');
        this.unstakeAmountInput = this.page.getByTestId('@staking/tron-unstake/amount-input');
        this.unstakeMaxButton = this.page.getByTestId('@staking/tron-unstake/max-button');
        this.unstakeStakedBalanceAmount = this.page.getByTestId(
            '@staking/tron-unstake/staked-balance/amount-with-symbol',
        );
        this.unstakeAmountError = this.page.getByTestId('@staking/tron-unstake/amount-error');
        this.unstakeResourceReduction = this.page.getByTestId(
            '@staking/tron-unstake/resource-reduction',
        );
        this.unstakeResourceChange = this.page.getByTestId('@staking/tron-unstake/resource-change');
        this.unstakeContinueButton = this.page.getByTestId('@staking/tron-unstake/continue-button');

        this.remainingVotes = this.page.getByTestId('@staking/tron-vote/remaining-votes');
        this.selectRepresentativesButton = this.page.getByTestId(
            '@staking/tron-vote/select-representatives-button',
        );
        this.votesToAllocateBanner = this.page.getByTestId(
            '@staking/tron-vote/votes-to-allocate-banner',
        );
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

        this.stakeConsentModal = this.page.getByTestId('@modal/tron-stake-consent');
        this.stakeConsentHeading = this.stakeConsentModal.getByTestId('@modal/header');
        this.stakeConsentDescription =
            this.stakeConsentModal.getByTestId('@modal/header-paragraph');
        this.stakeConsentCheckbox = this.stakeConsentModal.getByTestId(
            '@modal/tron-stake-consent/checkbox',
        );
        this.stakeConsentConfirmButton = this.stakeConsentModal.getByTestId(
            '@modal/tron-stake-consent/confirm-button',
        );

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
        this.completeDescription = this.page.getByTestId('@staking/tron-complete/description');
        this.summaryCard = this.page.getByTestId('@staking/tron-complete/summary-card');
        this.summaryEarnedResource = this.summaryCard.getByTestId(
            '@staking/tron-complete/earned-resource',
        );
        this.summarySuppliedAmount = this.summaryCard.getByTestId(
            '@staking/tron-complete/supplied-amount',
        );
        this.summaryUnstakedAmount = this.summaryCard.getByTestId(
            '@staking/tron-complete/unstaked-amount',
        );
        this.summaryResourceReduction = this.summaryCard.getByTestId(
            '@staking/tron-complete/resource-reduction',
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
        this.resourcesCard = this.page.getByTestId('@staking/tron-resources-card/container');
        this.unstakingCard = this.page.getByTestId('@staking/tron-unstaking-card/container');
        this.withdrawReadyBanner = this.page.getByTestId('@staking/tron-withdraw-banner/container');
    }

    // The confirmed toast replaces the pending one for the same txid; dismissing the pending toast
    // first keeps the message locator unique.
    @step()
    async dismissToast(type: TronStakingToastType) {
        await this.toastCloseButton(type).click();
        await expect(this.toast(type)).toBeHidden();
    }
}
