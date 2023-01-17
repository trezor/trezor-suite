import { EventEmitter } from 'events';

import * as coordinator from './coordinator';
import { findNearestDeadline, getDataFromRounds } from '../utils/roundUtils';
import { STATUS_TIMEOUT } from '../constants';
import { RoundPhase } from '../enums';
import { CoinjoinClientSettings, CoinjoinStatusEvent } from '../types';
import { Round } from '../types/coordinator';

type StatusMode = keyof typeof STATUS_TIMEOUT;

interface StatusEvents {
    update: CoinjoinStatusEvent;
    exception: string;
}

export declare interface Status {
    on<K extends keyof StatusEvents>(type: K, listener: (event: StatusEvents[K]) => void): this;
    off<K extends keyof StatusEvents>(type: K, listener: (event: StatusEvents[K]) => void): this;
    emit<K extends keyof StatusEvents>(type: K, ...args: StatusEvents[K][]): boolean;
}

export class Status extends EventEmitter {
    enabled = false;
    timestamp = 0;
    nextTimestamp = 0;
    rounds: Round[] = [];
    mode: StatusMode = 'idle';
    private settings: CoinjoinClientSettings;
    private abortController: AbortController;
    private statusTimeout?: ReturnType<typeof setTimeout>;
    private identities: string[]; // registered identities

    constructor(settings: CoinjoinClientSettings) {
        super();
        this.settings = settings;
        this.abortController = new AbortController();
        this.identities = ['Satoshi'];
    }

    private compareStatus(next: Round[]) {
        return next
            .filter(nextRound => {
                const known = this.rounds.find(prevRound => prevRound.id === nextRound.id);
                if (!known) return true; // new phase
                if (nextRound.phase === known.phase + 1) return true; // expected update
                if (
                    nextRound.phase === RoundPhase.TransactionSigning &&
                    !known.affiliateRequest &&
                    nextRound.affiliateRequest
                ) {
                    return true; // affiliateRequest is propagated asynchronously, might be added after phase change
                }

                if (
                    known.phase === RoundPhase.Ended &&
                    known.endRoundState !== nextRound.endRoundState
                )
                    return true;
                if (nextRound.phase === RoundPhase.Ended && known.phase !== RoundPhase.Ended)
                    return true; // round ended
                if (nextRound.phase !== known.phase) {
                    this.emit(
                        'exception',
                        `Unexpected phase change: ${nextRound.id} ${known.phase} => ${nextRound.phase}`,
                    );
                }
                return false;
            })
            .concat(
                // end known rounds which are missing in /status
                this.rounds
                    .filter(
                        prevRound =>
                            prevRound.phase < RoundPhase.Ended &&
                            !next.find(nextRound => prevRound.id === nextRound.id),
                    )
                    .map(r => ({ ...r, phase: RoundPhase.Ended })),
            );
    }

    setMode(mode: StatusMode) {
        if (this.mode !== mode) {
            this.mode = mode;
            if (this.enabled && this.nextTimestamp > Date.now() + STATUS_TIMEOUT[this.mode]) {
                // set to lower timeout
                this.clearStatusTimeout();
                this.setStatusTimeout();
            }
        }
    }

    addIdentity(id: string) {
        if (!this.identities.includes(id)) {
            this.identities.push(id);
        }
    }

    removeIdentity(id: string) {
        this.identities = this.identities.filter(i => i !== id);
    }

    private clearStatusTimeout() {
        if (this.statusTimeout) clearTimeout(this.statusTimeout);
        this.statusTimeout = undefined;
    }

    private setStatusTimeout() {
        if (!this.enabled) return;

        const nearestDeadline = findNearestDeadline(this.rounds);
        // TODO: add timeout randomness?
        const timeout =
            this.mode !== 'idle' && nearestDeadline > 0
                ? Math.min(nearestDeadline, STATUS_TIMEOUT[this.mode])
                : STATUS_TIMEOUT[this.mode];
        this.timestamp = Date.now();
        this.nextTimestamp = this.timestamp + timeout;

        this.statusTimeout = setTimeout(() => {
            this.getStatus().then(() => {
                // single status request might fail (no scheduled attempts are set)
                // continue lifecycle regardless of the result until this.enabled
                this.setStatusTimeout();
            });
        }, timeout);
    }

    private processStatus(status: coordinator.CoinjoinStatus) {
        // add matching coinjoinRequest to rounds
        status.roundStates.forEach(round => {
            const roundRequest = status.affiliateInformation.coinjoinRequests[round.id];
            round.affiliateRequest = roundRequest?.trezor;
        });

        const changed = this.compareStatus(status.roundStates);
        this.rounds = status.roundStates;

        if (changed.length) {
            const statusEvent = {
                rounds: status.roundStates,
                changed,
                feeRatesMedians: status.coinJoinFeeRateMedians,
                ...getDataFromRounds(status.roundStates),
            };
            this.emit('update', statusEvent);
            return statusEvent;
        }
    }

    async getStatus(attempts?: number) {
        if (!this.enabled) return;

        try {
            const identity = this.identities[Math.floor(Math.random() * this.identities.length)];
            const status = await coordinator.getStatus({
                baseUrl: this.settings.coordinatorUrl,
                signal: this.abortController.signal,
                identity,
                attempts,
            });
            return this.processStatus(status);
        } catch (error) {
            this.emit('exception', error.message);
        }
    }

    start() {
        this.abortController = new AbortController();
        this.enabled = true;
        // schedule 3 attempts on start
        return this.getStatus(3).then(status => {
            if (status) {
                // start lifecycle only if status is present
                this.setStatusTimeout();
            }
            return status;
        });
    }

    stop() {
        this.abortController.abort();
        this.enabled = false;
        this.removeAllListeners();
        this.clearStatusTimeout();
        this.rounds = [];
    }
}
