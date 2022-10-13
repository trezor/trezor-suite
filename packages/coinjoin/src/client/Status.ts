import { EventEmitter } from 'events';

import * as coordinator from './coordinator';
import { findNearestDeadline, getCoordinatorFeeRate } from '../utils/roundUtils';
import { STATUS_TIMEOUT } from '../constants';
import { CoinjoinClientSettings, CoinjoinStatusEvent } from '../types';
import { Round, RoundPhase } from '../types/coordinator';

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

    clearStatusTimeout() {
        if (this.statusTimeout) clearTimeout(this.statusTimeout);
        this.statusTimeout = undefined;
    }

    compareStatus(next: Round[]) {
        return next.filter(nextRound => {
            const known = this.rounds.find(prevRound => prevRound.id === nextRound.id);
            if (!known) return true; // new phase
            if (nextRound.phase === known.phase + 1) return true; // expected update
            if (known.phase === RoundPhase.Ended && known.endRoundState !== nextRound.endRoundState)
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
        });
    }

    setMode(mode: StatusMode) {
        if (this.mode !== mode) {
            this.mode = mode;
            if (this.enabled && this.nextTimestamp > Date.now() + STATUS_TIMEOUT[this.mode]) {
                // set to lower timeout
                this.clearStatusTimeout();
                this.statusTimeout = setTimeout(() => this.getStatus(), STATUS_TIMEOUT[this.mode]);
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

    async getStatus() {
        if (!this.enabled) return;

        const identity = this.identities[Math.floor(Math.random() * this.identities.length)];
        let status: Awaited<ReturnType<typeof coordinator.getStatus>> | undefined;
        try {
            status = await coordinator.getStatus({
                baseUrl: this.settings.coordinatorUrl,
                signal: this.abortController.signal,
                identity,
            });
        } catch (error) {
            this.emit('exception', error.message);
        }

        if (status) {
            const changed = this.compareStatus(status.roundStates);
            this.rounds = status.roundStates;
            const nearestDeadline = findNearestDeadline(this.rounds);
            // TODO: add timeout randomness?
            const timeout =
                this.mode !== 'idle' && nearestDeadline > 0
                    ? Math.min(nearestDeadline, STATUS_TIMEOUT[this.mode])
                    : STATUS_TIMEOUT[this.mode];
            this.timestamp = Date.now();
            this.nextTimestamp = this.timestamp + timeout;
            this.statusTimeout = setTimeout(() => this.getStatus(), timeout);
            if (changed.length) {
                const statusEvent = {
                    rounds: status.roundStates,
                    changed,
                    feeRatesMedians: status.coinJoinFeeRateMedians,
                    coordinatorFeeRate: getCoordinatorFeeRate(status.roundStates),
                };
                this.emit('update', statusEvent);
                return statusEvent;
            }
        }
    }

    start() {
        this.abortController = new AbortController();
        this.enabled = true;
        return this.getStatus();
    }

    stop() {
        this.abortController.abort();
        this.enabled = false;
        this.removeAllListeners();
        this.clearStatusTimeout();
        this.rounds = [];
    }
}
