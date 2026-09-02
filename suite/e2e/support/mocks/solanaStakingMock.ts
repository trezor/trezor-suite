import { Page } from '@playwright/test';

import { PASSTHROUGH, SolanaRpcServerMock } from '@trezor/e2e-utils';

import solSimulateStakeTransaction from '../../fixtures/staking/sol-simulate-stake-transaction.json';
import solStakeTransaction from '../../fixtures/staking/sol-stake-transactionResponse.json';
import {
    SolanaStakingAccount,
    solStakingAccountDeactivating,
    solStakingAccountFirst,
} from '../../fixtures/staking/sol-staking-accounts';
import { step } from '../common';

const UPSTREAM_URL = 'https://sol.trezor.io/';
const ACCOUNT_ADDRESS = '8NapsSamBA2jd8VR8SZw4aXSvSAHiskUZXaiYW1HxTGe';
const STAKE_PROGRAM_ADDRESS = 'Stake11111111111111111111111111111111111111';
const SYSTEM_PROGRAM_ADDRESS = '11111111111111111111111111111111';
const TRANSACTION_SIGNATURE =
    '41ZJr1SqnXVXym6EKrvfELQWh4pPdPeUSrj1GvcPNq9eL7Dh7QyCQXS65yahU6QtoBBNnfEJNGQ7poWRe4Gbk2Zd';

// Frozen so stake warmup/withdraw/claim amounts stay deterministic; they depend on the relation
// between a stake account's activation/deactivation epoch and the current epoch.
const INITIAL_EPOCH = 864;
const ACCOUNT_BALANCE_LAMPORTS = 1_000_000_000_000;
const SLOTS_IN_EPOCH = 432000;
const SLOT_INDEX = 376284;

const buildEpochInfo = (epoch: number) => ({
    absoluteSlot: epoch * SLOTS_IN_EPOCH + SLOT_INDEX,
    blockHeight: 359120112,
    epoch,
    slotIndex: SLOT_INDEX,
    slotsInEpoch: SLOTS_IN_EPOCH,
    transactionCount: 464794163561,
});

export class SolanaStakingMock {
    private readonly server = new SolanaRpcServerMock(UPSTREAM_URL);
    private readonly balances = new Map<string, number>([
        [ACCOUNT_ADDRESS, ACCOUNT_BALANCE_LAMPORTS],
    ]);
    private epoch = INITIAL_EPOCH;
    private stakeAccounts: SolanaStakingAccount[] = [];
    private simulatedTransaction: unknown = solSimulateStakeTransaction;
    private transactionConfirmed = false;
    private revision = 0;

    readonly stakeFeeFormatted = '0.002298742 SOL';
    readonly unstakeFeeFormatted = '0.000015862 SOL';
    readonly claimFeeFormatted = '0.000008605 SOL';

    constructor(private readonly page: Page) {}

    get url(): string {
        return this.server.url;
    }

    @step()
    async start() {
        this.registerHandlers();
        await this.server.start();
    }

    @step()
    async stop() {
        await this.server.stop();
    }

    @step()
    setBalance(address: string, lamports: number) {
        this.balances.set(address, lamports);
        this.revision += 1;
    }

    @step()
    setStakeAccounts(accounts: SolanaStakingAccount[]) {
        this.stakeAccounts = accounts;
        this.revision += 1;
    }

    @step()
    async setEpoch(epoch: number) {
        await this.applyEpoch(epoch);
    }

    @step()
    async advanceEpoch() {
        await this.applyEpoch(this.epoch + 1);
    }

    private async applyEpoch(epoch: number) {
        this.epoch = epoch;
        this.revision += 1;
        await this.rebuildBackend();
    }

    /**
     * The worker caches the current epoch for an hour, and on desktop it runs in the Electron main
     * process, out of reach of the test's fake clock. Re-applying the backend setting makes Suite
     * rebuild the backend, which disposes the worker together with its cache and, on connect,
     * resyncs the account.
     */
    private async rebuildBackend() {
        await this.page.evaluate(
            payload => {
                // Tests set the mocked chain up before the app connects a backend; then there is
                // nothing to rebuild yet.
                if (!window.store?.getState().wallet.blockchain.sol?.connected) return;

                window.store.dispatch({
                    type: '@common/wallet-core/blockchain/setBackend',
                    payload,
                });
            },
            { symbol: 'sol', type: 'solana', urls: [this.url] },
        );
    }

    // Makes the broadcasted transaction discoverable, simulating its on-chain confirmation. Kept off
    // during discovery, where a phantom signature would be mistaken for existing account history.
    @step()
    confirmTransaction() {
        this.transactionConfirmed = true;
        this.revision += 1;
    }

    @step()
    setSimulatedTransaction(simulation: unknown) {
        this.simulatedTransaction = simulation;
    }

    @step()
    async setupStakedAccount() {
        this.setStakeAccounts([solStakingAccountFirst.payload]);
        await this.setEpoch(solStakingAccountFirst.activationEpoch + 1);
    }

    @step()
    async setupUnstakingAccount() {
        this.setStakeAccounts([solStakingAccountDeactivating.payload]);
        await this.setEpoch(solStakingAccountDeactivating.deactivationEpoch);
    }

    private registerHandlers() {
        this.server.setHandler('getEpochInfo', () => buildEpochInfo(this.epoch));
        this.server.setHandler('getBalance', ([address]) => {
            const lamports = this.balances.get(String(address));

            return lamports === undefined ? PASSTHROUGH : { context: { slot: 0 }, value: lamports };
        });
        this.server.setHandler('getProgramAccounts', ([programAddress]) =>
            programAddress === STAKE_PROGRAM_ADDRESS ? this.stakeAccounts : PASSTHROUGH,
        );
        // The worker fingerprints addresses through getMultipleAccounts to decide whose signatures
        // it may serve from its cache instead of refetching. Only the lamports and the first data
        // chunk make up that fingerprint, so encoding the revision into the data is what makes every
        // change to the mocked chain state invalidate the cache.
        this.server.setHandler('getMultipleAccounts', ([addresses]) => ({
            context: { slot: 0 },
            value: (addresses as string[]).map(address => {
                const data = Buffer.from(`revision:${this.revision}`);

                return {
                    data: [data.toString('base64'), 'base64'],
                    executable: false,
                    lamports: this.balances.get(address) ?? 0,
                    owner: SYSTEM_PROGRAM_ADDRESS,
                    rentEpoch: 0,
                    space: data.byteLength,
                };
            }),
        }));
        this.server.setHandler('simulateTransaction', () => ({ value: this.simulatedTransaction }));
        this.server.setHandler('sendTransaction', () => TRANSACTION_SIGNATURE);
        this.server.setHandler('getSignatureStatuses', () => ({
            value: [
                {
                    slot: 48,
                    confirmations: null,
                    err: null,
                    status: { Ok: null },
                    confirmationStatus: 'finalized',
                },
            ],
        }));
        this.server.setHandler('getRecentPrioritizationFees', () => [
            { prioritizationFee: 0, slot: 394770899 },
        ]);
        this.server.setHandler('getFeeForMessage', () => ({ value: 5000 }));
        this.server.setHandler('getMinimumBalanceForRentExemption', () => 2282880);
        this.server.setHandler('getSignaturesForAddress', ([address]) =>
            this.transactionConfirmed && address === ACCOUNT_ADDRESS
                ? [
                      {
                          blockTime: 1758796808,
                          confirmationStatus: 'finalized',
                          err: null,
                          memo: null,
                          signature: TRANSACTION_SIGNATURE,
                          slot: 369150991,
                      },
                  ]
                : PASSTHROUGH,
        );
        this.server.setHandler('getTransaction', ([signature]) =>
            this.transactionConfirmed && signature === TRANSACTION_SIGNATURE
                ? solStakeTransaction
                : PASSTHROUGH,
        );
    }
}
