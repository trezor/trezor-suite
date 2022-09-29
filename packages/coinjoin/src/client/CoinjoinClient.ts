import { EventEmitter } from 'events';

import { Status, OnStatusUpdate } from './Status';
import { selectRound, finishCurrentProcess, processRounds, resolveRequests } from './phase';
import { registerAccount } from './account';
import {
    CoinjoinClientSettings,
    CoinjoinStatusEvent,
    CoinjoinClientEvent,
    RegisterAccountParams,
    RegisteredAccount,
    ActiveRound,
    RequestEvent,
    RoundPhase,
} from '../types';

interface Events {
    status: CoinjoinStatusEvent;
    request: RequestEvent[];
    log: any[];
    event: CoinjoinClientEvent;
    error: any;
}

export declare interface CoinjoinClient {
    on<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    off<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    emit<K extends keyof Events>(type: K, ...args: Events[K][]): boolean;
    removeAllListeners<K extends keyof Events>(type?: K): this;
}

export class CoinjoinClient extends EventEmitter {
    readonly settings: CoinjoinClientSettings;
    private abortController: AbortController; // used for immediate interruption
    private accounts: RegisteredAccount[]; // list of registered accounts
    private activeRounds: ActiveRound[]; // list of active rounds
    private usedAddresses: any[]; // temporary list of addresses used in active round, may be modified after account update
    private bannedUtxos: any[]; // list of banned utxos, may be modified after account update
    // private bannedOutputs: any[]; // list of banned outputs
    private status: Status;

    constructor(settings: CoinjoinClientSettings) {
        super();
        this.settings = Object.freeze(settings);
        this.abortController = new AbortController();
        this.accounts = [];
        this.activeRounds = [];
        this.usedAddresses = [];
        this.bannedUtxos = [];
        // this.bannedOutputs = [];
        this.status = new Status(settings);
        this.status.on('update', event => {
            this.onStatusUpdate(event);
            if (event.changed.length > 0) {
                this.emit('status', event);
            }
        });
    }

    private log(...args: any[]) {
        if (this.listenerCount('log') > 0) {
            this.emit('log', ...args);
        }
    }

    private async onStatusUpdate({ changed, rounds }: OnStatusUpdate) {
        // try to finish/interrupt current running process on changed round (if exists)
        await finishCurrentProcess(changed);

        // find all ActiveRounds affected by changed Status/Rounds
        const roundsToProcess = changed.reduce((result, round) => {
            const active = this.activeRounds.find(r => r.id === round.id);
            return active
                ? result.concat({
                      ...active,
                      phase: round.phase,
                      coinjoinState: round.coinjoinState,
                  }) // update ActiveRound data from Status
                : result;
        }, [] as ActiveRound[]);

        const options = {
            signal: this.abortController.signal,
            coordinatorName: this.settings.coordinatorName,
            coordinatorUrl: this.settings.coordinatorUrl,
            middlewareUrl: this.settings.middlewareUrl,
            log: (...args: any[]) => this.log(...args),
        };

        // there are no ActiveRounds to process. try to create new ActiveRound
        if (roundsToProcess.length === 0) {
            const round = await selectRound(this.accounts, rounds, this.activeRounds, options);
            if (round) {
                roundsToProcess.push(round);
            }
        }

        // notify wallet
        roundsToProcess.forEach(round => {
            this.emit('event', {
                type: 'round-change',
                payload: round,
            });
        });

        if (roundsToProcess.length > 0) {
            const {
                rounds: processedRounds,
                requests,
                failed,
            } = await processRounds(roundsToProcess, this.accounts, options);

            processedRounds.forEach(round => {
                if (round.addresses) {
                    this.usedAddresses.concat(round.addresses);
                }
            });

            // store banned utxos
            failed.forEach(utxo => {
                // TODO: get real message
                if (utxo.error && utxo.error.message.includes('ban')) {
                    this.bannedUtxos.push(utxo);
                }
            });

            this.updateActiveRounds(processedRounds);
            if (requests.length > 0) {
                this.emit('request', requests);
            }
        }
    }

    // handle the result of the Status update > processRounds
    private updateActiveRounds(rounds: ActiveRound[]) {
        if (rounds.length < 1) return;
        rounds.forEach(round => {
            this.emit('event', {
                type: 'round-change',
                payload: round,
            });
        });
        this.activeRounds = this.activeRounds
            .filter(
                active =>
                    !rounds.find(round => round.id === active.id) &&
                    active.phase !== RoundPhase.Ended,
            )
            .concat(rounds.filter(r => r.phase !== RoundPhase.Ended));
    }

    enable() {
        if (this.abortController.signal.aborted) {
            this.abortController = new AbortController();
        }
        return this.status.start();
    }

    disable() {
        this.removeAllListeners();
        this.abortController.abort();
        this.status.stop();
    }

    registerAccount(account: RegisterAccountParams) {
        if (this.accounts.find(a => a.descriptor === account.descriptor)) {
            this.updateAccount(account);
            return;
        }

        this.accounts.push(registerAccount(account));

        // TODO: only temporary, to trigger registration immediately without waiting for status change
        this.onStatusUpdate({ rounds: this.status.rounds, changed: [], feeRatesMedians: [] });
    }

    updateAccount(account: RegisterAccountParams) {
        const accountToUpdate = this.accounts.find(a => a.descriptor === account.descriptor);
        if (accountToUpdate) {
            // TODO: check if account/utxos is not registered in any ActiveRound
            // TODO: update usedAddresses and bannedUtxos related to this account
            this.accounts = this.accounts
                .filter(a => a.descriptor !== account.descriptor)
                .concat([registerAccount(account)]);

            const activeRounds = this.activeRounds.filter(round =>
                Object.keys(round.accounts).includes(account.descriptor),
            );
            if (activeRounds.length === 0) {
                // TODO: check Status next tick (possible race condition)
                // TODO: only temporary, to trigger registration immediately without waiting for status change
                this.onStatusUpdate({
                    rounds: this.status.rounds,
                    changed: [],
                    feeRatesMedians: [],
                });
            }
        }
    }

    unregisterAccount(descriptor: string) {
        // TODO: check if account/utxos is not registered in any ActiveRound
        // TODO: update usedAddresses and bannedUtxos related to this account
        const activeRounds = this.activeRounds.filter(round =>
            Object.keys(round.accounts).includes(descriptor),
        );
        if (activeRounds.length > 0) {
            const { rounds } = this.status;
            const changed = rounds.filter(round =>
                activeRounds.find(active => active.id === round.id),
            );
            finishCurrentProcess(changed);

            const roundsToUpdate = activeRounds.map(r => {
                const roundAccounts = r.accounts;
                delete roundAccounts[descriptor];
                // TODO: unregister if it's possible
                return {
                    ...r,
                    accounts: roundAccounts,
                };
            });
            this.updateActiveRounds(roundsToUpdate);
        }

        this.accounts = this.accounts.filter(a => a.descriptor !== descriptor);
    }

    resolveRequest(response: RequestEvent[]) {
        // TODO: validate errors or missing but expected fields (ownership, witness)
        const roundsToUpdate = resolveRequests(this.activeRounds, response);
        // const acctoupdate = response.flatMap(event => {
        //     if (event.type === 'witness') {
        //         Object.keys(event.accounts).forEach(key => {
        //             const aa = this.accounts.find(a => a.descriptor === key);
        //             return aa || [];
        //         });
        //     }
        //     return [];
        // });
        // if (acctoupdate.length) {
        //     // this.accounts = this.accounts.map(a => {
        //     // })
        // }
        this.updateActiveRounds(roundsToUpdate);

        const { rounds } = this.status;
        const changed = rounds.filter(round =>
            roundsToUpdate.find(active => active.id === round.id),
        );
        this.onStatusUpdate({ rounds, changed, feeRatesMedians: [] });
    }
}
