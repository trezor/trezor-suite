import { EventEmitter } from 'events';

import * as coordinator from './coordinator';
import { CoinjoinClientSettings, Round, RoundPhase, FeeRateMedians } from '../types';

export interface OnStatusUpdate {
    rounds: Round[];
    changed: Round[];
    feeRatesMedians: FeeRateMedians[];
}

interface Events {
    update: OnStatusUpdate;
    exception: string;
}

export declare interface Status {
    on<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    off<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    emit<K extends keyof Events>(type: K, ...args: Events[K][]): boolean;
}

// TODO:
// - check if connected to desired backend (by blockhash? by shortcut?)
// - load initial state

// Main: 0000000000000000001c8018d9cb3b742ef25114f27563e3fc4a1902167f9893
// TestNet: 00000000000f0d5edcaeba823db17f366be49a80d91d15b77747c2e017b8c20a
// RegTest: 0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206

export class Status extends EventEmitter {
    enabled = false;
    timestamp = 0;
    rounds: Round[] = [];
    blockchain = {
        bestKnownBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
        bestBlock: 1,
    };
    private settings: CoinjoinClientSettings;
    private abortController: AbortController;
    private statusTimeout?: ReturnType<typeof setTimeout>;
    private identities: string[];

    constructor(settings: CoinjoinClientSettings) {
        super();
        this.settings = settings;
        this.abortController = new AbortController();
        this.identities = ['status-default'];
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
            // TODO: handle detailed changes (events added, endround)
            // if (known.phase === RoundPhase.Ended) {
            //     return (
            //         nextRound.endRoundState !== known.endRoundState ||
            //         nextRound.coinjoinState.isFullySigned !== known.coinjoinState.isFullySigned
            //     );
            // }
            return false;
        });
    }

    addIdentity(id: string) {
        this.identities.push(id);
    }

    removeIdentity(id: string) {
        this.identities = this.identities.filter(i => i !== id);
    }

    async getStatus() {
        if (!this.enabled) return;
        try {
            const status = await coordinator.getStatus({
                baseUrl: this.settings.coordinatorUrl,
                signal: this.abortController.signal,
                identity: this.identities[0], // TODO
            });
            const changed = this.compareStatus(status.roundStates);
            this.rounds = status.roundStates;
            this.timestamp = Date.now();
            this.statusTimeout = setTimeout(() => this.getStatus(), 5000); // TODO: find nearest deadline in rounds + add randomness
            if (changed.length) {
                this.emit('update', {
                    rounds: status.roundStates,
                    changed,
                    feeRatesMedians: status.coinJoinFeeRateMedians,
                });
                return status;
            }
        } catch (error) {
            this.emit('exception', error.message);
        }
    }

    start() {
        this.abortController = new AbortController();
        this.enabled = true;
        return this.getStatus();
    }

    stop() {
        this.abortController.abort();
        this.removeAllListeners();
        this.clearStatusTimeout();
        this.rounds = [];
    }
}
