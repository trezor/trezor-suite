import { EventEmitter } from 'events';

import { Status } from './Status';
import { Account } from './Account';
import { CoinjoinPrison } from './CoinjoinPrison';
import { CoinjoinRound } from './CoinjoinRound';
import { getNetwork } from '../utils/settingsUtils';
import { analyzeTransactions, AnalyzeTransactionsResult } from './analyzeTransactions';
import type {
    CoinjoinClientSettings,
    RegisterAccountParams,
    CoinjoinStatusEvent,
    CoinjoinRoundEvent,
    CoinjoinRequestEvent,
    CoinjoinResponseEvent,
} from '../types';

interface Events {
    status: CoinjoinStatusEvent;
    round: CoinjoinRoundEvent;
    request: CoinjoinRequestEvent[];
    exception: string;
    log: string;
}

export declare interface CoinjoinClient {
    on<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    off<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    emit<K extends keyof Events>(type: K, ...args: Events[K][]): boolean;
    removeAllListeners<K extends keyof Events>(type?: K): this;
}

export class CoinjoinClient extends EventEmitter {
    readonly settings: CoinjoinClientSettings;
    private network;
    private abortController: AbortController; // used for interruption
    private status: Status;
    private accounts: Account[] = []; // list of registered accounts
    private rounds: CoinjoinRound[] = []; // list of active rounds
    private prison: CoinjoinPrison; // list of temporary blocked inputs/addresses

    constructor(settings: CoinjoinClientSettings) {
        super();
        this.settings = Object.freeze(settings);
        this.network = getNetwork(settings.network);
        this.abortController = new AbortController();

        this.status = new Status(settings);
        this.status.on('update', event => {
            this.onStatusUpdate(event);
            if (event.changed.length > 0) {
                this.emit('status', event);
            }
        });
        this.status.on('exception', event => this.emit('exception', event));

        this.prison = new CoinjoinPrison();
    }

    enable() {
        if (this.abortController.signal.aborted) {
            this.abortController = new AbortController();
        }
        return this.status.start();
    }

    disable() {
        this.removeAllListeners();
        this.rounds.forEach(r => r.end());
        this.rounds = [];
        this.accounts = [];
        this.abortController.abort();
        this.status.stop();
    }

    /**
     * Get transactions from CoinjoinBackend.getAccountInfo and calculate anonymity in middleware.
     * Returns { key => value } where `key` is an address and `value` is an anonymity level of that address
     */
    analyzeTransactions<T extends keyof AnalyzeTransactionsResult>(
        txs: Parameters<typeof analyzeTransactions>[0],
        sections?: Parameters<typeof analyzeTransactions<T>>[2],
    ) {
        return analyzeTransactions(
            txs,
            {
                network: this.network,
                middlewareUrl: this.settings.middlewareUrl,
                signal: this.abortController.signal,
            },
            sections,
        );
    }

    registerAccount(account: RegisterAccountParams) {
        if (this.accounts.find(a => a.accountKey === account.accountKey)) {
            throw new Error('Trying to register account that already exists');
        }
        this.log(`Register account ~~${account.accountKey}~~`);

        // iterate Status more frequently
        if (this.accounts.length === 0) {
            this.status.setMode('enabled');
        }

        this.accounts.push(new Account(account, this.network));

        // try to trigger registration immediately without waiting for Status change
        this.onStatusUpdate({
            rounds: this.status.rounds,
            changed: [],
        });
    }

    updateAccount(account: RegisterAccountParams) {
        this.log(`Update account ~~${account.accountKey}~~`);
        const accountToUpdate = this.accounts.find(a => a.accountKey === account.accountKey);
        if (accountToUpdate) {
            this.rounds.forEach(round => round.updateAccount(account));

            accountToUpdate.update(account);

            // try to trigger registration immediately without waiting for Status change
            this.onStatusUpdate({
                rounds: this.status.rounds,
                changed: [],
            });
        }
    }

    unregisterAccount(accountKey: string) {
        this.log(`Unregister account ~~${accountKey}~~`);
        this.rounds.forEach(round => {
            round.unregisterAccount(accountKey);
        });

        this.accounts = this.accounts.filter(a => a.accountKey !== accountKey);

        // iterate Status less frequently
        if (this.accounts.length === 0) {
            this.status.setMode('idle');
        }
    }

    resolveRequest(response: CoinjoinResponseEvent[]) {
        const { rounds } = this.status;
        const changed: typeof rounds = [];
        response.forEach(event => {
            const currentRound = this.rounds.find(r => r.id === event.roundId);
            if (currentRound) {
                currentRound.resolveRequest(event);
                const statusRound = this.status.rounds.find(r => r.id === event.roundId);
                if (statusRound) {
                    changed.push(statusRound);
                }
            }
        });

        // trigger round processing
        this.onStatusUpdate({ rounds, changed });
    }

    // emit log events to wallet
    private log(message: string) {
        if (this.listenerCount('log') < 1) return;
        // redact log messages, parts wrapped into <...> like accountKey, round id, outpoint etc
        const redacted = message.replace(/(~~([^~~]+)~~)/g, match => {
            if (match.length > 16) {
                return `${match.substring(2, 10)}...${match.substring(
                    match.length - 10,
                    match.length - 2,
                )}`;
            }
            return `[redacted]`;
        });

        this.emit('log', redacted);
    }

    private async onStatusUpdate({
        changed,
        rounds,
    }: Pick<CoinjoinStatusEvent, 'changed' | 'rounds'>) {
        // try to release inputs from prison
        this.prison.release();

        // find all CoinjoinRounds changed by Status
        const roundsToProcess = await Promise.all(
            changed.flatMap(round => {
                const currentRound = this.rounds.find(r => r.id === round.id);
                if (currentRound) {
                    // try to finish/interrupt current running process on changed round (if any)
                    // and update fresh data from Status
                    return currentRound.onPhaseChange(round);
                }
                return [];
            }),
        );

        // there are no CoinjoinRounds to process? try to create new one
        if (roundsToProcess.length === 0) {
            const newRound = await CoinjoinRound.create(
                this.accounts,
                rounds,
                this.rounds,
                this.prison,
                {
                    network: this.network,
                    signal: this.abortController.signal,
                    coordinatorName: this.settings.coordinatorName,
                    coordinatorUrl: this.settings.coordinatorUrl,
                    middlewareUrl: this.settings.middlewareUrl,
                    log: (message: string) => this.log(message),
                },
            );

            if (newRound) {
                // try to release all inmates detained due to blame round
                this.prison.releaseBlameOfInmates(newRound.blameOf);

                roundsToProcess.push(newRound);
                if (!this.rounds.find(r => r.id === newRound.id)) {
                    newRound.on('changed', event => this.emit('round', event));
                    newRound.on('ended', ({ round }) => {
                        round.inputs.concat(round.failed).forEach(input => {
                            // remove identities from Status
                            this.status.removeIdentity(input.outpoint);
                        });
                        // remove round from the list
                        this.rounds = this.rounds.filter(r => r.id !== newRound.id);
                        // set Status mode
                        if (this.rounds.length === 0) {
                            this.status.setMode(this.accounts.length > 0 ? 'enabled' : 'idle');
                        }
                        // try to create new round immediately if previous didn't fail
                        if (round.failed.length === 0) {
                            this.onStatusUpdate({ changed: [], rounds: this.status.rounds });
                        }
                    });
                    // add new round to the list
                    this.rounds.push(newRound);
                }
            }
        }

        // process rounds
        const processedRounds = await Promise.all(
            roundsToProcess.map(round => {
                // add new identity to Status
                round.inputs.forEach(u => {
                    this.status.addIdentity(u.outpoint);
                });
                this.status.setMode('registered');

                // wait for the result
                return round.process(this.accounts, this.prison);
            }),
        );

        // check for wallet requests
        const requests = processedRounds.flatMap(round => round.getRequest() || []);
        if (requests.length > 0) {
            this.emit('request', requests);
        }
    }
}
