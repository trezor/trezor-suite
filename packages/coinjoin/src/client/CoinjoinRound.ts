import { EventEmitter } from 'events';

import { arrayPartition } from '@trezor/utils';

import {
    getCommitmentData,
    getRoundParameters,
    getCoinjoinRoundDeadlines,
} from '../utils/roundUtils';
import { AccountAddress, RegisterAccountParams } from '../types/account';
import {
    SerializedCoinjoinRound,
    CoinjoinRoundEvent,
    CoinjoinTransactionData,
    CoinjoinRequestEvent,
    CoinjoinResponseEvent,
} from '../types/round';
import { RoundPhase, Round, CoinjoinRoundParameters } from '../types/coordinator';
import { inputRegistration } from './phase/inputRegistration';
import { connectionConfirmation } from './phase/connectionConfirmation';
import { outputRegistration } from './phase/outputRegistration';
import { transactionSigning } from './phase/transactionSigning';
import type { Account } from './Account';
import type { Alice } from './Alice';
import type { CoinjoinPrison } from './CoinjoinPrison';

export interface CoinjoinRoundOptions {
    signal: AbortSignal;
    coordinatorName: string;
    coordinatorUrl: string;
    middlewareUrl: string;
    log: (...args: any[]) => any;
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
    let localReject: (e?: Error) => void = () => {};

    const promise: Promise<void> = new Promise((resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
    });

    const localAbort = new AbortController();
    mainSignal.addEventListener('abort', () => {
        localAbort.abort();
    });

    return {
        resolve: localResolve,
        reject: localReject,
        abort: localAbort.abort.bind(localAbort),
        signal: localAbort.signal,
        promise,
    };
};

export class CoinjoinRound extends EventEmitter implements SerializedCoinjoinRound {
    private lock?: ReturnType<typeof createRoundLock>;
    private options: CoinjoinRoundOptions;

    // partial coordinator.Round
    id: string;
    phase: RoundPhase;
    coinjoinState: Round['coinjoinState'];
    inputRegistrationEnd: string;
    amountCredentialIssuerParameters: Round['amountCredentialIssuerParameters'];
    vsizeCredentialIssuerParameters: Round['vsizeCredentialIssuerParameters'];
    //
    roundParameters: CoinjoinRoundParameters;
    inputs: Alice[] = []; // list of registered inputs
    failed: Alice[] = []; // list of failed inputs
    phaseDeadline: number; // deadline is inaccurate, phase may change earlier
    roundDeadline: number; // deadline is inaccurate,round may end earlier
    commitmentData: string; // commitment data used for ownership proof and witness requests
    addresses: AccountAddress[] = []; // list of addresses (outputs) used in this round in outputRegistration phase
    transactionData?: CoinjoinTransactionData; // transaction to sign

    constructor(round: Round, options: CoinjoinRoundOptions) {
        super();
        this.id = round.id;
        this.phase = 0;
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

    static create(
        accounts: Account[],
        statusRounds: Round[],
        coinjoinRounds: CoinjoinRound[],
        options: CoinjoinRoundOptions,
    ) {
        // TODO: this code will be removed with "selectRound" implementation
        if (coinjoinRounds.find(r => r.id === 'fakeroundid') || accounts.length === 0) {
            return;
        }
        const firstRound = statusRounds.find(r => r.phase === RoundPhase.InputRegistration);
        if (!firstRound) return;
        const round = new CoinjoinRound(firstRound, options);
        return Promise.resolve(round);
    }

    async onPhaseChange(changed: Round) {
        // if round is currently locked interrupt running process
        if (this.lock) {
            this.options.log(`Aborting round ${this.id}`);
            this.lock.abort();
            await this.lock.promise;
        }

        if (this.phase === RoundPhase.Ended) return this;

        // update data from status
        this.phase = changed.phase;
        this.coinjoinState = changed.coinjoinState;
        const { phaseDeadline, roundDeadline } = getCoinjoinRoundDeadlines(this);
        this.phaseDeadline = phaseDeadline;
        this.roundDeadline = roundDeadline;

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

        const [inputs, failed] = arrayPartition(this.inputs, input => {
            if (input.error) {
                prison.ban(input.outpoint, { roundId: this.id, reason: input.error.message });
            }
            return !input.error;
        });
        this.inputs = inputs;
        this.failed = this.failed.concat(...failed);

        this.emit('changed', { round: this.toSerialized() });

        if (this.inputs.length === 0 || this.phase === RoundPhase.Ended) {
            this.phase = RoundPhase.Ended;
            this.emit('ended', { round: this });
        }

        this.lock?.resolve();
        this.lock = undefined;

        return this;
    }

    private processPhase(accounts: Account[], prison: CoinjoinPrison) {
        this.lock = createRoundLock(this.options.signal);
        const processOptions = { ...this.options, signal: this.lock.signal };
        // try to run process on CoinjoinRound
        if (this.phase === RoundPhase.InputRegistration) {
            return inputRegistration(this, prison, processOptions);
        }
        if (this.phase === RoundPhase.ConnectionConfirmation) {
            return connectionConfirmation(this, processOptions);
        }
        if (this.phase === RoundPhase.OutputRegistration) {
            return outputRegistration(this, accounts, prison, processOptions);
        }
        if (this.phase === RoundPhase.TransactionSigning) {
            return transactionSigning(this, processOptions);
        }
        if (this.phase === RoundPhase.Ended) {
            return Promise.resolve(this);
        }
        return Promise.resolve(this);
    }

    postProcess(rounds: CoinjoinRound[]) {
        const failed: CoinjoinRound['inputs'] = [];
        const updateRounds = rounds.map(round => {
            const failedInRound: CoinjoinRound['inputs'] = [];
            const inputs = round.inputs.filter(input => {
                if (input.error) {
                    failedInRound.push(input);
                    return false;
                }
                return true;
            });
            round.inputs = inputs;
            round.failed = round.failed.concat(failedInRound);
            failed.push(...failedInRound);
            return round;
        });

        const requests = updateRounds.flatMap(round => round.getRequest() || []);

        return {
            rounds: updateRounds,
            requests,
            failed,
        };
    }

    getRequest(): CoinjoinRequestEvent | void {
        if (this.phase === RoundPhase.InputRegistration) {
            const inputs = this.inputs.filter(input => !input.ownershipProof && !input.requested);
            if (inputs.length > 0) {
                inputs.forEach(input => {
                    this.options.log(`Requesting ownership for ${input.outpoint}`);
                    input.setRequest('ownership');
                });
                return {
                    type: 'ownership',
                    roundId: this.id,
                    inputs,
                    commitmentData: this.commitmentData,
                };
            }
        }
        if (this.phase === RoundPhase.TransactionSigning) {
            const inputs = this.inputs.filter(i => !i.witness && !i.requested);
            if (inputs.length > 0 && this.transactionData) {
                inputs.forEach(input => {
                    this.options.log(`Requesting witness for ${input.outpoint}`);
                    input.setRequest('witness');
                });
                return {
                    type: 'witness',
                    roundId: this.id,
                    inputs,
                    transaction: this.transactionData,
                };
            }
        }
    }

    resolveRequest({ type, inputs }: CoinjoinResponseEvent) {
        const { log } = this.options;
        inputs.forEach(i => {
            const input = this.inputs.find(a => a.outpoint === i.outpoint);
            // reset request in input
            input?.setRequest();
            if ('error' in i) {
                log(`Resolving ${type} request for ${i.outpoint} with error. ${i.error}`);
                input?.setError(new Error(i.error));
            } else if ('ownershipProof' in i) {
                log(`Resolving ${type} request for ${i.outpoint}`);
                input?.setOwnershipProof(i.ownershipProof);
            } else if ('witness' in i) {
                log(`Resolving ${type} request for ${i.outpoint}`);
                input?.setWitness(i.witness, i.witnessIndex);
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
        spentInputs.forEach(input => (input.error = new Error('Spent')));

        this.breakRound(spentInputs);
    }

    unregisterAccount(accountKey: string) {
        // find registered inputs related to Account
        const affectedInputs = this.inputs.filter(input => input.accountKey === accountKey);
        // set error on each input
        affectedInputs.forEach(input => (input.error = new Error('Unregistered')));

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

    // serialize class
    // data emitted in "round" event
    toSerialized(): SerializedCoinjoinRound {
        return {
            id: this.id,
            phase: this.phase,
            inputs: this.inputs.map(i => ({
                outpoint: i.outpoint,
                accountKey: i.accountKey,
                path: i.path,
            })),
            failed: this.failed.map(i => ({
                outpoint: i.outpoint,
                accountKey: i.accountKey,
                path: i.path,
            })),
            addresses: this.addresses,
            phaseDeadline: this.phaseDeadline,
            roundDeadline: this.roundDeadline,
        };
    }
}
