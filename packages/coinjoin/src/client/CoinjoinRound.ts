import { TypedEmitter } from '@trezor/utils';
import { scheduleAction, arrayDistinct, arrayPartition } from '@trezor/utils';
import { Network } from '@trezor/utxo-lib';

import {
    getCommitmentData,
    getRoundParameters,
    getCoinjoinRoundDeadlines,
} from '../utils/roundUtils';
import { ROUND_PHASE_PROCESS_TIMEOUT, ACCOUNT_BUSY_TIMEOUT } from '../constants';
import { EndRoundState, RoundPhase, SessionPhase } from '../enums';
import { AccountAddress, RegisterAccountParams } from '../types/account';
import {
    SerializedCoinjoinRound,
    CoinjoinRoundEvent,
    CoinjoinTransactionData,
    CoinjoinTransactionLiquidityClue,
    CoinjoinRequestEvent,
    CoinjoinResponseEvent,
    BroadcastedTransactionDetails,
} from '../types/round';
import { Round, CoinjoinRoundParameters } from '../types/coordinator';
import { Account } from './Account';
import { Alice } from './Alice';
import { CoinjoinPrison } from './CoinjoinPrison';
import { selectRound } from './round/selectRound';
import { inputRegistration } from './round/inputRegistration';
import { connectionConfirmation } from './round/connectionConfirmation';
import { outputRegistration } from './round/outputRegistration';
import { transactionSigning } from './round/transactionSigning';
import { ended } from './round/endedRound';
import { CoinjoinClientEvents, Logger } from '../types';

export interface CoinjoinRoundOptions {
    network: Network;
    signal: AbortSignal;
    coordinatorName: string;
    coordinatorUrl: string;
    middlewareUrl: string;
    logger: Logger;
    setSessionPhase: (event: CoinjoinClientEvents['session-phase']) => void;
}

interface Events {
    ended: CoinjoinRoundEvent;
    changed: CoinjoinRoundEvent;
}

const createRoundLock = (mainSignal: AbortSignal) => {
    let localResolve: () => void = () => {};
    const promise: Promise<void> = new Promise(resolve => {
        localResolve = resolve;
    });

    const localAbort = new AbortController();
    const mainSignalListener = () => localAbort.abort();
    const clearMainSignalListener = () =>
        mainSignal.removeEventListener('abort', mainSignalListener);

    const abort = () => {
        clearMainSignalListener();
        localAbort.abort();
    };
    const resolve = () => {
        clearMainSignalListener();
        localResolve();
    };

    mainSignal.addEventListener('abort', mainSignalListener);

    return {
        resolve,
        abort,
        signal: localAbort.signal,
        promise,
    };
};

interface CreateRoundProps {
    accounts: Account[];
    statusRounds: Round[];
    coinjoinRounds: CoinjoinRound[];
    prison: CoinjoinPrison;
    options: CoinjoinRoundOptions;
    runningAffiliateServer: boolean;
}

export class CoinjoinRound extends TypedEmitter<Events> {
    private lock?: ReturnType<typeof createRoundLock>;
    private options: CoinjoinRoundOptions;
    private logger: Logger;
    private signed = false; // set after successful transactionSigning
    readonly prison: CoinjoinPrison;

    // partial coordinator.Round
    id: string;
    blameOf: string;
    phase: RoundPhase;
    endRoundState: EndRoundState;
    coinjoinState: Round['CoinjoinState'];
    inputRegistrationEnd: string;
    amountCredentialIssuerParameters: Round['AmountCredentialIssuerParameters'];
    vsizeCredentialIssuerParameters: Round['VsizeCredentialIssuerParameters'];
    affiliateRequest: Round['AffiliateRequest'];
    //
    roundParameters: CoinjoinRoundParameters;
    inputs: Alice[] = []; // list of registered inputs
    failed: Alice[] = []; // list of failed inputs
    phaseDeadline: number; // deadline is inaccurate, phase may change earlier
    roundDeadline: number; // deadline is inaccurate,round may end earlier
    commitmentData: string; // commitment data used for ownership proof and witness requests
    addresses: (AccountAddress & { accountKey: string })[] = []; // list of addresses (outputs) used in this round in outputRegistration phase
    transactionSignTries: number[] = []; // timestamps for processing transactionSigning phase
    transactionData?: CoinjoinTransactionData; // transaction to sign
    broadcastedTxDetails?: BroadcastedTransactionDetails; // transaction broadcasted
    liquidityClues?: CoinjoinTransactionLiquidityClue[]; // updated liquidity clues

    constructor(round: Round, prison: CoinjoinPrison, options: CoinjoinRoundOptions) {
        super();
        this.id = round.Id;
        this.blameOf = round.BlameOf;
        this.phase = 0;
        this.endRoundState = round.EndRoundState;
        this.coinjoinState = round.CoinjoinState;
        this.inputRegistrationEnd = round.InputRegistrationEnd;
        this.amountCredentialIssuerParameters = round.AmountCredentialIssuerParameters;
        this.vsizeCredentialIssuerParameters = round.VsizeCredentialIssuerParameters;
        const roundParameters = getRoundParameters(round);
        if (!roundParameters) {
            throw new Error('Missing CoinjoinRound roundParameters');
        }
        this.roundParameters = roundParameters;
        this.commitmentData = getCommitmentData(options.coordinatorName, round.Id);
        const { phaseDeadline, roundDeadline } = getCoinjoinRoundDeadlines({
            Phase: this.phase,
            InputRegistrationEnd: this.inputRegistrationEnd,
            RoundParameters: roundParameters,
        });
        this.phaseDeadline = phaseDeadline;
        this.roundDeadline = roundDeadline;
        this.options = options;
        this.logger = options.logger;
        this.prison = prison;
    }

    setSessionPhase(phase: SessionPhase) {
        const accountKeys = this.inputs
            .concat(this.failed)
            .map(input => input.accountKey)
            .filter(arrayDistinct);

        this.options.setSessionPhase({
            phase,
            accountKeys,
        });
    }

    static create({
        accounts,
        statusRounds,
        coinjoinRounds,
        prison,
        options,
        runningAffiliateServer,
    }: CreateRoundProps) {
        return selectRound({
            roundGenerator: (...args) => new CoinjoinRound(...args),
            aliceGenerator: (...args) => new Alice(...args),
            accounts,
            statusRounds,
            coinjoinRounds,
            prison,
            options,
            runningAffiliateServer,
        });
    }

    async onPhaseChange(changed: Round) {
        if (this.lock) {
            // if round is currently locked and phase was changed in expected order
            // try to interrupt running process and start processing new phase
            // but give current process some time to cool off
            // example: http request is sent but response was not received yet and aborted
            const shouldCoolOff = changed.Phase === this.phase + 1;
            const { promise, abort } = this.lock;
            const unlock = () => {
                this.logger.warn(`Aborting round ${this.id}`);
                abort();
                return promise;
            };

            if (!shouldCoolOff) {
                await unlock();
            } else {
                this.logger.info(
                    `Waiting for round ${this.id} to cool off ${ROUND_PHASE_PROCESS_TIMEOUT}ms`,
                );
                // either process will finish gracefully or will be aborted
                await scheduleAction(() => promise, { timeout: ROUND_PHASE_PROCESS_TIMEOUT }).catch(
                    unlock,
                );
            }
        }

        if (this.phase === RoundPhase.Ended) return this;

        // update data from status
        if (this.phase !== changed.Phase) {
            this.phase = changed.Phase;
            this.endRoundState = changed.EndRoundState;
            this.coinjoinState = changed.CoinjoinState;
            const { phaseDeadline, roundDeadline } = getCoinjoinRoundDeadlines({
                Phase: this.phase,
                InputRegistrationEnd: this.inputRegistrationEnd,
                RoundParameters: this.roundParameters,
            });
            this.phaseDeadline = phaseDeadline;
            this.roundDeadline = roundDeadline;
        }

        // update affiliateRequest once and keep the value
        // affiliateData are removed from the status once phase is changed to Ended
        if (!this.affiliateRequest && changed.AffiliateRequest) {
            this.affiliateRequest = changed.AffiliateRequest;
        }

        // NOTE: emit changed event before each async phase
        if (changed.Phase !== RoundPhase.Ended) {
            this.emit('changed', { round: this.toSerialized() });
        }

        return this;
    }

    async process(accounts: Account[]) {
        const { info: log } = this.logger;
        if (this.inputs.length === 0) {
            log('Trying to process round without inputs');
            return this;
        }
        await this.processPhase(accounts);

        const [inputs, failed] = arrayPartition(this.inputs, input => !input.error);
        this.inputs = inputs;

        if (this.phase === RoundPhase.InputRegistration && failed.length > 0) {
            // strictly follow the result of `middleware.selectInputsForRound` algorithm
            // if **any** input registration fails for **any** reason exclude all inputs related to this account
            const failedAccounts = failed.map(input => input.accountKey).filter(arrayDistinct);
            this.inputs = inputs.filter(input => {
                const shouldBeExcluded = failedAccounts.includes(input.accountKey);
                if (shouldBeExcluded) {
                    input.clearConfirmationInterval();
                }
                return !shouldBeExcluded;
            });
        } else if (this.phase > RoundPhase.InputRegistration) {
            failed.forEach(input =>
                this.prison.detain(input, {
                    roundId: this.id,
                    reason: input.error?.message,
                }),
            );
            this.failed = this.failed.concat(...failed);
        }

        if (this.phase > RoundPhase.ConnectionConfirmation) {
            inputs.forEach(i => i.clearConfirmationInterval());
        }

        if (this.inputs.length === 0) {
            // CoinjoinRound ends because there is no inputs left
            // if this happens in critical phase then this instance will break the Round for everyone
            this.phase = RoundPhase.Ended;
        }

        if (this.phase === RoundPhase.Ended) {
            this.emit('ended', { round: this.toSerialized() });
        }

        this.emit('changed', { round: this.toSerialized() });

        this.lock?.resolve();
        this.lock = undefined;

        return this;
    }

    private processPhase(accounts: Account[]) {
        this.lock = createRoundLock(this.options.signal);
        const processOptions = { ...this.options, signal: this.lock.signal };
        // try to run process on CoinjoinRound
        switch (this.phase) {
            case RoundPhase.InputRegistration:
                return inputRegistration(this, processOptions);
            case RoundPhase.ConnectionConfirmation:
                return connectionConfirmation(this, processOptions);
            case RoundPhase.OutputRegistration:
                return outputRegistration(this, accounts, processOptions);
            case RoundPhase.TransactionSigning:
                return transactionSigning(this, accounts, processOptions);
            case RoundPhase.Ended:
                return ended(this, processOptions);
            default:
                return Promise.resolve(this);
        }
    }

    signedSuccessfully() {
        this.signed = true;
    }

    isSignedSuccessfully() {
        return this.signed;
    }

    getRequest(): CoinjoinRequestEvent | void {
        if (this.phase === RoundPhase.InputRegistration) {
            const inputs = this.inputs.filter(input => !input.ownershipProof && !input.requested);
            if (inputs.length > 0) {
                inputs.forEach(input => {
                    this.logger.info(`Requesting ownership for ~~${input.outpoint}~~`);
                    input.setRequest('ownership');
                });
                return {
                    type: 'ownership',
                    roundId: this.id,
                    inputs: inputs.map(i => i.toSerialized()),
                    commitmentData: this.commitmentData,
                };
            }
        }
        if (this.phase === RoundPhase.TransactionSigning) {
            const inputs = this.inputs.filter(i => !i.witness && !i.requested);
            if (inputs.length > 0 && this.transactionData && this.liquidityClues) {
                this.setSessionPhase(SessionPhase.TransactionSigning);
                inputs.forEach(input => {
                    this.logger.info(`Requesting witness for ~~${input.outpoint}~~`);
                    input.setRequest('signature');
                });
                return {
                    type: 'signature',
                    roundId: this.id,
                    inputs: inputs.map(i => i.toSerialized()),
                    transaction: this.transactionData,
                    liquidityClues: this.liquidityClues,
                };
            }
        }
    }

    resolveRequest({ type, inputs }: CoinjoinResponseEvent) {
        const { info: log } = this.logger;
        inputs.forEach(i => {
            const input = this.inputs.find(a => a.outpoint === i.outpoint);
            if (!input) return;
            // reset request in input
            input.resolveRequest();
            if ('error' in i) {
                log(`Resolving ${type} request for ~~${i.outpoint}~~ with error. ${i.error}`);
                input.setError(new Error(i.error));
                if (type === 'ownership') {
                    // wallet request respond with error, account (device) is busy,
                    // detain whole account for short while and try again later
                    this.prison.detain(
                        { accountKey: input.accountKey },
                        {
                            sentenceEnd: ACCOUNT_BUSY_TIMEOUT,
                        },
                    );
                }
            } else if ('ownershipProof' in i) {
                log(`Resolving ${type} request for ~~${i.outpoint}~~`);
                input.setOwnershipProof(i.ownershipProof);
            } else if ('signature' in i) {
                log(`Resolving ${type} request for ~~${i.outpoint}~~`);
                input.setWitness(i.signature, i.index);
            }
        });
    }

    updateAccount(account: RegisterAccountParams) {
        // find registered inputs related to Account
        const affectedInputs = this.inputs.filter(input => input.accountKey === account.accountKey);
        // find inputs which are no longer in utxos set
        const spentInputs = affectedInputs.filter(
            input => !account.utxos.find(u => u.outpoint === input.outpoint),
        );
        // set error on each input
        spentInputs.forEach(input => {
            input.clearConfirmationInterval();
            input.setError(new Error('Input spent'));
        });

        this.breakRound(spentInputs);
    }

    unregisterAccount(accountKey: string) {
        // find registered inputs related to Account
        const registeredInputs = this.inputs.filter(input => input.accountKey === accountKey);
        // set error on each input
        registeredInputs.forEach(input => {
            input.clearConfirmationInterval();
            input.setError(new Error('Unregistered account'));
        });

        this.breakRound(registeredInputs);
    }

    // decide if round process should be interrupted by Account change
    private breakRound(inputs: Alice[]) {
        if (inputs.length < 1) return;

        let breaking = false;
        if (this.phase > RoundPhase.InputRegistration) {
            // unregistered in critical phase, breaking the round
            breaking = true;
        }
        if (inputs.length === this.inputs.length || !this.inputs.filter(i => !i.error).length) {
            // no more inputs left in round, breaking the round
            breaking = true;
        }

        if (breaking) {
            if (this.lock) {
                // abort processing if locked. Round will be ended automatically as result of abort
                this.lock.abort();
            } else {
                // emit events if not locked
                this.phase = RoundPhase.Ended;
                this.emit('ended', { round: this.toSerialized() });
                this.emit('changed', { round: this.toSerialized() });
            }
        }
    }

    onAffiliateServerStatus(status: boolean) {
        if (!status) {
            // if affiliate server goes offline try to abort round if it's not in critical phase.
            // if round is in critical phase, there is noting much we can do, just log it...
            // ...we need to continue and hope that server will become online before transaction signing phase
            if (this.phase <= RoundPhase.OutputRegistration) {
                this.logger.warn(`Affiliate server offline. Aborting round ${this.id}`);
                this.lock?.abort();
                this.inputs.forEach(i => i.clearConfirmationInterval());
            } else {
                this.logger.error(`Affiliate server offline in phase ${this.phase}!`);
            }
        }
    }

    // forced by CoinjoinClient.disable. stop processes if any
    end() {
        this.logger.info(`Aborting round ${this.id}`);
        this.lock?.abort();

        this.inputs.forEach(i => i.clearConfirmationInterval());

        this.phase = RoundPhase.Ended;
        this.inputs = [];
        this.failed = [];
        this.addresses = [];
        this.removeAllListeners();
    }

    // serialize class
    // data emitted in "round" event
    toSerialized(): SerializedCoinjoinRound {
        return {
            id: this.id,
            phase: this.phase,
            endRoundState: this.endRoundState,
            broadcastedTxDetails: this.broadcastedTxDetails,
            inputs: this.inputs.map(i => i.toSerialized()),
            failed: this.failed.map(i => i.toSerialized()),
            addresses: this.addresses,
            phaseDeadline: this.phaseDeadline,
            roundDeadline: this.roundDeadline,
        };
    }

    isInCriticalPhase() {
        return this.phase > RoundPhase.InputRegistration && this.phase < RoundPhase.Ended;
    }
}
