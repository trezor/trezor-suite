import { EventEmitter } from 'events';

import { scheduleAction, arrayDistinct, arrayPartition, enumUtils } from '@trezor/utils';
import { Network } from '@trezor/utxo-lib';

import {
    getCommitmentData,
    getRoundParameters,
    getCoinjoinRoundDeadlines,
} from '../utils/roundUtils';
import { ROUND_PHASE_PROCESS_TIMEOUT } from '../constants';
import { RoundPhase, EndRoundState, SessionPhase } from '../enums';
import { AccountAddress, RegisterAccountParams } from '../types/account';
import {
    SerializedCoinjoinRound,
    CoinjoinRoundEvent,
    CoinjoinTransactionData,
    CoinjoinTransactionLiquidityClue,
    CoinjoinRequestEvent,
    CoinjoinResponseEvent,
} from '../types/round';
import { Round, CoinjoinRoundParameters, WabiSabiProtocolErrorCode } from '../types/coordinator';
import { Account } from './Account';
import { Alice } from './Alice';
import { CoinjoinPrison } from './CoinjoinPrison';
import { selectRound } from './round/selectRound';
import { inputRegistration } from './round/inputRegistration';
import { connectionConfirmation } from './round/connectionConfirmation';
import { outputRegistration } from './round/outputRegistration';
import { transactionSigning } from './round/transactionSigning';
import { CoinjoinClientEvents } from '../types';

export interface CoinjoinRoundOptions {
    network: Network;
    signal: AbortSignal;
    coordinatorName: string;
    coordinatorUrl: string;
    middlewareUrl: string;
    log: (message: string) => void;
    setSessionPhase: (event: CoinjoinClientEvents['session-phase']) => void;
}

interface Events {
    ended: CoinjoinRoundEvent;
    changed: CoinjoinRoundEvent;
}

export declare interface CoinjoinRound {
    on<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    off<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    emit<K extends keyof Events>(type: K, ...args: Events[K][]): boolean;
    removeAllListeners<K extends keyof Events>(type?: K): this;
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
}

export class CoinjoinRound extends EventEmitter {
    private lock?: ReturnType<typeof createRoundLock>;
    private options: CoinjoinRoundOptions;

    // partial coordinator.Round
    id: string;
    blameOf: string;
    phase: RoundPhase;
    endRoundState: EndRoundState;
    coinjoinState: Round['coinjoinState'];
    inputRegistrationEnd: string;
    amountCredentialIssuerParameters: Round['amountCredentialIssuerParameters'];
    vsizeCredentialIssuerParameters: Round['vsizeCredentialIssuerParameters'];
    affiliateRequest: Round['affiliateRequest'];
    //
    roundParameters: CoinjoinRoundParameters;
    inputs: Alice[] = []; // list of registered inputs
    failed: Alice[] = []; // list of failed inputs
    phaseDeadline: number; // deadline is inaccurate, phase may change earlier
    roundDeadline: number; // deadline is inaccurate,round may end earlier
    commitmentData: string; // commitment data used for ownership proof and witness requests
    addresses: AccountAddress[] = []; // list of addresses (outputs) used in this round in outputRegistration phase
    transactionData?: CoinjoinTransactionData; // transaction to sign
    liquidityClues?: CoinjoinTransactionLiquidityClue[]; // updated liquidity clues

    constructor(round: Round, options: CoinjoinRoundOptions) {
        super();
        this.id = round.id;
        this.blameOf = round.blameOf;
        this.phase = 0;
        this.endRoundState = round.endRoundState;
        this.coinjoinState = round.coinjoinState;
        this.inputRegistrationEnd = round.inputRegistrationEnd;
        this.amountCredentialIssuerParameters = round.amountCredentialIssuerParameters;
        this.vsizeCredentialIssuerParameters = round.vsizeCredentialIssuerParameters;
        const roundParameters = getRoundParameters(round);
        if (!roundParameters) {
            throw new Error('Missing CoinjoinRound roundParameters');
        }
        this.roundParameters = roundParameters;
        this.commitmentData = getCommitmentData(options.coordinatorName, round.id);
        const { phaseDeadline, roundDeadline } = getCoinjoinRoundDeadlines(this as any);
        this.phaseDeadline = phaseDeadline;
        this.roundDeadline = roundDeadline;
        this.options = options;
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

    static create({ accounts, statusRounds, coinjoinRounds, prison, options }: CreateRoundProps) {
        return selectRound({
            roundGenerator: (...args) => new CoinjoinRound(...args),
            aliceGenerator: (...args) => new Alice(...args),
            accounts,
            statusRounds,
            coinjoinRounds,
            prison,
            options,
        });
    }

    async onPhaseChange(changed: Round) {
        if (this.lock) {
            // if round is currently locked and phase was changed in expected order
            // try to interrupt running process and start processing new phase
            // but give current process some time to cool off
            // example: http request is sent but response was not received yet and aborted
            const shouldCoolOff = changed.phase === this.phase + 1;
            const { promise, abort } = this.lock;
            const unlock = () => {
                this.options.log(`Aborting round ${this.id}`);
                abort();
                return promise;
            };

            if (!shouldCoolOff) {
                await unlock();
            } else {
                this.options.log(
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
        this.phase = changed.phase;
        this.endRoundState = changed.endRoundState;
        this.coinjoinState = changed.coinjoinState;
        const { phaseDeadline, roundDeadline } = getCoinjoinRoundDeadlines(this);
        this.phaseDeadline = phaseDeadline;
        this.roundDeadline = roundDeadline;
        this.affiliateRequest = changed.affiliateRequest;

        this.emit('changed', { round: this.toSerialized() });

        return this;
    }

    async process(accounts: Account[], prison: CoinjoinPrison) {
        const { log } = this.options;
        if (this.inputs.length === 0) {
            log('Trying to process round without inputs');
            return this;
        }
        await this.processPhase(accounts, prison);

        const [inputs, failed] = arrayPartition(this.inputs, input => !input.error);
        this.inputs = inputs;

        // do not pass failed inputs from InputRegistration to further phases
        if (this.phase > RoundPhase.InputRegistration) {
            failed.forEach(input =>
                prison.detain(input.outpoint, { roundId: this.id, reason: input.error?.message }),
            );
            this.failed = this.failed.concat(...failed);
        }

        if (this.phase > RoundPhase.ConnectionConfirmation) {
            inputs.forEach(i => i.clearConfirmationInterval());
        }

        if (this.inputs.length === 0 || this.phase === RoundPhase.Ended) {
            this.phase = RoundPhase.Ended;
            log(
                `Ending round ~~${this.id}~~. End state ${enumUtils.getKeyByValue(
                    EndRoundState,
                    this.endRoundState,
                )}`,
            );

            this.emit('ended', { round: this.toSerialized() });

            if (this.endRoundState === EndRoundState.TransactionBroadcasted) {
                // detain all signed inputs and addresses forever
                this.inputs.forEach(input =>
                    prison.detain(input.outpoint, {
                        roundId: this.id,
                        reason: WabiSabiProtocolErrorCode.InputSpent,
                        sentenceEnd: Infinity,
                    }),
                );

                this.addresses.forEach(addr =>
                    prison.detain(addr.scriptPubKey, {
                        roundId: this.id,
                        reason: WabiSabiProtocolErrorCode.AlreadyRegisteredScript,
                        sentenceEnd: Infinity,
                    }),
                );
            } else if (this.endRoundState === EndRoundState.NotAllAlicesSign) {
                log('Awaiting blame round');
                const inmates = this.inputs
                    .map(i => i.outpoint)
                    .concat(this.addresses.map(a => a.scriptPubKey));

                prison.detainForBlameRound(inmates, this.id);
            } else if (this.endRoundState === EndRoundState.AbortedNotEnoughAlices) {
                prison.releaseRegisteredInmates(this.id);
            }
        }

        this.emit('changed', { round: this.toSerialized() });

        this.lock?.resolve();
        this.lock = undefined;

        return this;
    }

    private processPhase(accounts: Account[], prison: CoinjoinPrison) {
        this.lock = createRoundLock(this.options.signal);
        const processOptions = { ...this.options, signal: this.lock.signal };
        // try to run process on CoinjoinRound
        switch (this.phase) {
            case RoundPhase.InputRegistration:
                return inputRegistration(this, prison, processOptions);
            case RoundPhase.ConnectionConfirmation:
                return connectionConfirmation(this, processOptions);
            case RoundPhase.OutputRegistration:
                return outputRegistration(this, accounts, prison, processOptions);
            case RoundPhase.TransactionSigning:
                return transactionSigning(this, accounts, processOptions);
            default:
                return Promise.resolve(this);
        }
    }

    getRequest(): CoinjoinRequestEvent | void {
        if (this.phase === RoundPhase.InputRegistration) {
            const inputs = this.inputs.filter(input => !input.ownershipProof && !input.requested);
            if (inputs.length > 0) {
                inputs.forEach(input => {
                    this.options.log(`Requesting ownership for ~~${input.outpoint}~~`);
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
                    this.options.log(`Requesting witness for ~~${input.outpoint}~~`);
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
        const { log } = this.options;
        inputs.forEach(i => {
            const input = this.inputs.find(a => a.outpoint === i.outpoint);
            if (!input) return;
            // reset request in input
            input.setRequest();
            if ('error' in i) {
                log(`Resolving ${type} request for ~~${i.outpoint}~~ with error. ${i.error}`);
                input.setError(new Error(i.error));
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
        spentInputs.forEach(input =>
            input.setError(new Error(WabiSabiProtocolErrorCode.InputSpent)),
        ); // TODO: error same as wasabi coordinator?

        this.breakRound(spentInputs);
    }

    unregisterAccount(accountKey: string) {
        // find registered inputs related to Account
        const affectedInputs = this.inputs.filter(input => input.accountKey === accountKey);
        // set error on each input
        affectedInputs.forEach(input => input.setError(new Error('Unregistered account')));

        this.breakRound(affectedInputs);
    }

    // decide if round process should be interrupted by Account change
    private breakRound(inputs: Alice[]) {
        if (inputs.length > 0) {
            if (this.phase > RoundPhase.InputRegistration) {
                // unregistered in critical phase, breaking the round
                this.lock?.abort();
            }
            if (inputs.length === this.inputs.length) {
                // no more inputs left in round, breaking the round
                this.lock?.abort();
            }
        }
    }

    // forced by CoinjoinClient.disable. stop processes if any
    end() {
        this.options.log(`Aborting round ${this.id}`);
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
            inputs: this.inputs.map(i => i.toSerialized()),
            failed: this.failed.map(i => i.toSerialized()),
            addresses: this.addresses,
            phaseDeadline: this.phaseDeadline,
            roundDeadline: this.roundDeadline,
        };
    }
}
