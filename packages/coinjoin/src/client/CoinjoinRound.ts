import { EventEmitter } from 'events';

import { arrayPartition } from '@trezor/utils';
import { Network } from '@trezor/utxo-lib';

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
import {
    RoundPhase,
    Round,
    CoinjoinRoundParameters,
    WabiSabiProtocolErrorCode,
} from '../types/coordinator';
import { Account } from './Account';
import { Alice } from './Alice';
import { CoinjoinPrison } from './CoinjoinPrison';
import { selectRound } from './round/selectRound';
import { inputRegistration } from './round/inputRegistration';
import { connectionConfirmation } from './round/connectionConfirmation';
import { outputRegistration } from './round/outputRegistration';
import { transactionSigning } from './round/transactionSigning';

export interface CoinjoinRoundOptions {
    network: Network;
    signal: AbortSignal;
    coordinatorName: string;
    coordinatorUrl: string;
    middlewareUrl: string;
    log: (message: string) => void;
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
        prison: CoinjoinPrison,
        options: CoinjoinRoundOptions,
    ) {
        return selectRound(
            (...args: ConstructorParameters<typeof CoinjoinRound>) => new CoinjoinRound(...args),
            (...args: ConstructorParameters<typeof Alice>) => new Alice(...args),
            accounts,
            statusRounds,
            coinjoinRounds,
            prison,
            options,
        );
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

        const [inputs, failed] = arrayPartition(this.inputs, input => !input.error);
        failed.forEach(input =>
            prison.detain(input.outpoint, { roundId: this.id, reason: input.error?.message }),
        );
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
        switch (this.phase) {
            case RoundPhase.InputRegistration:
                return inputRegistration(this, prison, processOptions);
            case RoundPhase.ConnectionConfirmation:
                return connectionConfirmation(this, processOptions);
            case RoundPhase.OutputRegistration:
                return outputRegistration(this, accounts, prison, processOptions);
            case RoundPhase.TransactionSigning:
                return transactionSigning(this, processOptions);
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
                    inputs,
                    commitmentData: this.commitmentData,
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
            inputs: this.inputs.map(i => i.toSerialized()),
            failed: this.failed.map(i => i.toSerialized()),
            addresses: this.addresses,
            phaseDeadline: this.phaseDeadline,
            roundDeadline: this.roundDeadline,
        };
    }
}
