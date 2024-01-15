import { TypedEmitter } from '@trezor/node-utils/lib/typedEventEmitter';

import { Status } from './Status';
import { Account } from './Account';
import { CoinjoinPrison } from './CoinjoinPrison';
import { CoinjoinRound } from './CoinjoinRound';
import { getNetwork } from '../utils/settingsUtils';
import { redacted } from '../utils/redacted';
import { analyzeTransactions, AnalyzeTransactionsResult } from './analyzeTransactions';
import type {
    CoinjoinClientSettings,
    RegisterAccountParams,
    CoinjoinStatusEvent,
    CoinjoinResponseEvent,
    CoinjoinClientEvents,
    Logger,
    LogLevel,
} from '../types';

export class CoinjoinClient extends TypedEmitter<CoinjoinClientEvents> {
    readonly settings: CoinjoinClientSettings;
    private logger: Logger;
    private network;
    private abortController: AbortController; // used for interruption
    private status: Status;
    private accounts: Account[] = []; // list of registered accounts
    private rounds: CoinjoinRound[] = []; // list of active rounds
    private prison: CoinjoinPrison; // list of temporary blocked inputs/addresses

    constructor(settings: CoinjoinClientSettings) {
        super();
        this.settings = Object.freeze(settings);
        this.logger = this.getLogger();
        this.network = getNetwork(settings.network);
        this.abortController = new AbortController();

        this.status = new Status(settings);
        this.status.on('update', event => {
            this.onStatusUpdate(event);
            if (event.changed.length > 0) {
                this.emit('status', event);
            }
        });
        this.status.on('log', ({ level, payload }) => this.logger[level](payload));
        this.status.on('affiliate-server', event => this.onAffiliateServerStatus(event));

        this.prison = new CoinjoinPrison(settings.prison);
        this.prison.on('change', data => this.emit('prison', data));
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
                logger: this.logger,
                signal: this.abortController.signal,
            },
            sections,
        );
    }

    registerAccount(account: RegisterAccountParams) {
        if (this.accounts.find(a => a.accountKey === account.accountKey)) {
            throw new Error('Trying to register account that already exists');
        }
        this.logger.info(`Register account ~~${account.accountKey}~~`);

        const candidate = new Account(account, this.network);
        // walk thru all status Rounds and search in for accounts inputs/outputs which are not supposed to be there. (interrupted round)
        // detain them if they are not already detained
        const detained = candidate.findDetainedElements(this.status.rounds);
        detained.forEach(item => {
            if (!this.prison.isDetained(item)) {
                this.prison.detain(item);
            }
        });

        this.accounts.push(candidate);

        // iterate Status more frequently
        this.status.setMode('enabled');

        // try to trigger registration immediately without waiting for Status change
        this.onStatusUpdate({
            rounds: this.status.rounds,
            changed: [],
        });
    }

    updateAccount(account: RegisterAccountParams) {
        this.logger.info(`Update account ~~${account.accountKey}~~`);
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
        this.logger.info(`Unregister account ~~${accountKey}~~`);
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
                const statusRound = this.status.rounds.find(r => r.Id === event.roundId);
                if (statusRound) {
                    changed.push(statusRound);
                }
            }
        });

        // trigger round processing
        this.onStatusUpdate({ rounds, changed });
    }

    private setSessionPhase(event: CoinjoinClientEvents['session-phase']) {
        if (this.status.mode === 'idle') {
            return;
        }

        this.emit('session-phase', event);
    }

    private onAffiliateServerStatus(status: boolean) {
        this.rounds.map(r => r.onAffiliateServerStatus(status));
    }

    private async onStatusUpdate({
        changed,
        rounds,
    }: Pick<CoinjoinStatusEvent, 'changed' | 'rounds'>) {
        // try to release inputs from prison
        this.prison.release(rounds.map(r => r.Id));

        // find all CoinjoinRounds changed by Status
        const roundsToProcess = await Promise.all(
            changed.flatMap(round => {
                const currentRound = this.rounds.find(r => r.id === round.Id);
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
            const newRound = await CoinjoinRound.create({
                accounts: this.accounts,
                statusRounds: rounds,
                coinjoinRounds: this.rounds,
                prison: this.prison,
                runningAffiliateServer: this.status.isAffiliateServerRunning(),
                options: {
                    network: this.network,
                    signal: this.abortController.signal,
                    coordinatorName: this.settings.coordinatorName,
                    coordinatorUrl: this.settings.coordinatorUrl,
                    middlewareUrl: this.settings.middlewareUrl,
                    logger: this.logger,
                    setSessionPhase: sessionPhase => this.setSessionPhase(sessionPhase),
                },
            });

            if (newRound) {
                // try to release all inmates detained due to blame round
                this.prison.releaseBlameOfInmates(newRound.blameOf);

                roundsToProcess.push(newRound);
                if (!this.rounds.find(r => r.id === newRound.id)) {
                    // start follow round in Status
                    this.status.startFollowRound(newRound);
                    newRound.on('changed', event => this.emit('round', event));
                    newRound.on('ended', ({ round }) => {
                        round.inputs.concat(round.failed).forEach(input => {
                            // remove identities from Status
                            this.status.removeIdentity(input.outpoint);
                        });
                        // stop follow round in Status
                        this.status.stopFollowRound(round.id);
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
                return round.process(this.accounts);
            }),
        );

        // check for wallet requests
        const requests = processedRounds.flatMap(round => round.getRequest() || []);
        if (requests.length > 0) {
            this.emit('request', requests);
        }
    }

    private getLogger(): Logger {
        const emit = (level: LogLevel) => (payload: string) =>
            this.emit('log', { level, payload: redacted(payload) });
        return {
            debug: emit('debug'),
            info: emit('info'),
            warn: emit('warn'),
            error: emit('error'),
        };
    }

    getRounds() {
        return this.rounds.map(round => round.toSerialized());
    }

    getRoundsInCriticalPhase() {
        return this.rounds.flatMap(round =>
            round.isInCriticalPhase() ? round.toSerialized() : [],
        );
    }

    getAccounts() {
        return this.accounts;
    }
}
