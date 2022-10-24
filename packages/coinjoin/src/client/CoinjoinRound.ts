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
import type { Account } from './Account';

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

// Temporary. Alice will be added in next PR
interface Alice {
    path: string;
    accountKey: string;
    outpoint: string;
    error?: Error;
}

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

        round.startFakeRoundLifecycle(firstRound, accounts[0]);
        return Promise.resolve(round);
    }

    // temporary code to run Round lifecycle without actual coinjoining
    startFakeRoundLifecycle(round: Round, account: Account) {
        console.warn('Create fake round');
        this.id = 'fakeroundid';
        this.inputs = account.utxos.map(u => ({
            outpoint: u.outpoint,
            path: u.path,
            accountKey: account.accountKey,
        }));
        let currentPhase = 0;
        const timeoutFn = async () => {
            await this.onPhaseChange({ ...round, phase: currentPhase });
            await this.process([]);

            currentPhase++;
            if (this.failed.length === 0 && currentPhase <= RoundPhase.Ended) {
                setTimeout(() => timeoutFn(), 10000);
            }
        };

        timeoutFn();
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

    async process(accounts: Account[]) {
        const { log } = this.options;
        if (this.inputs.length === 0) {
            log('Trying to process round without inputs');
            return this;
        }
        await this.processPhase(accounts);

        const [inputs, failed] = arrayPartition(this.inputs, input => !!input.error);
        this.inputs = inputs;
        this.failed = failed;

        this.emit('changed', { round: this.toSerialized() });

        if (this.inputs.length === 0 || this.phase === RoundPhase.Ended) {
            this.phase = RoundPhase.Ended;
            this.emit('ended', { round: this });
        }

        this.lock?.resolve();
        this.lock = undefined;

        return this;
    }

    private processPhase(_accounts: Account[]) {
        this.lock = createRoundLock(this.options.signal);
        // try to run process on CoinjoinRound
        return new Promise(resolve => setTimeout(() => resolve(this), 2000));
    }

    getRequest(): CoinjoinRequestEvent | void {
        // TODO
    }

    resolveRequest(_: CoinjoinResponseEvent) {
        // TODO
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
