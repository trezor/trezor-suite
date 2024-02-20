import { TypedEmitter } from '@trezor/utils';

import * as coordinator from './coordinator';
import { transformStatus } from '../utils/roundUtils';
import { patchResponse } from '../utils/http';
import { coordinatorRequest } from './coordinatorRequest';
import { STATUS_TIMEOUT } from '../constants';
import { RoundPhase } from '../enums';
import {
    CoinjoinClientSettings,
    CoinjoinStatusEvent,
    LogEvent,
    CoinjoinClientVersion,
} from '../types';
import { Round } from '../types/coordinator';

type StatusMode = keyof typeof STATUS_TIMEOUT;

interface StatusEvents {
    update: CoinjoinStatusEvent;
    log: LogEvent;
    'affiliate-server': boolean;
}

// partial CoinjoinRound
interface RegisteredRound {
    id: string;
    phaseDeadline: number;
    inputs: { outpoint: string }[];
}

export class Status extends TypedEmitter<StatusEvents> {
    enabled = false;
    timestamp = 0;
    nextTimestamp = 0;
    rounds: Round[] = [];
    private registeredRound: RegisteredRound[] = [];
    mode: StatusMode = 'idle';
    private settings: CoinjoinClientSettings;
    private abortController: AbortController;
    private statusTimeout?: ReturnType<typeof setTimeout>;
    private identities: string[]; // registered identities
    private runningAffiliateServer = false;

    constructor(settings: CoinjoinClientSettings) {
        super();
        this.settings = settings;
        this.abortController = new AbortController();
        this.identities = ['Satoshi'];
    }

    private log(level: LogEvent['level'], payload: LogEvent['payload']) {
        this.emit('log', { level, payload });
    }

    private compareStatus(next: Round[]) {
        return next
            .filter(nextRound => {
                const known = this.rounds.find(prevRound => prevRound.Id === nextRound.Id);
                if (!known) return true; // new phase
                if (nextRound.Phase === known.Phase + 1) return true; // expected update
                if (nextRound.Phase === RoundPhase.TransactionSigning && !known.AffiliateRequest) {
                    return true; // affiliateRequest is propagated asynchronously, might be added after phase change
                }

                if (
                    known.Phase === RoundPhase.Ended &&
                    known.EndRoundState !== nextRound.EndRoundState
                )
                    return true;
                if (nextRound.Phase === RoundPhase.Ended && known.Phase !== RoundPhase.Ended)
                    return true; // round ended
                if (nextRound.Phase !== known.Phase) {
                    this.log(
                        'warn',
                        `Unexpected phase change: ${nextRound.Id} ${known.Phase} => ${nextRound.Phase}`,
                    );

                    // possible corner-case:
                    // - suite fetch the /status, next fetch will be in ~20 sec. + potential network delay
                    // - round is currently in phase "0" but will be changed to "1" in few seconds,
                    // - meanwhile all registered inputs sends /connection-confirmation, round phase on coordinator is changed to "2"
                    // - suite fetch the /status, round phase is changed from 0 to 2
                    return true;
                }

                return false;
            })
            .concat(
                // end known rounds which are missing in /status
                this.rounds
                    .filter(
                        prevRound =>
                            prevRound.Phase < RoundPhase.Ended &&
                            !next.find(nextRound => prevRound.Id === nextRound.Id),
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

    startFollowRound(round: RegisteredRound) {
        if (!this.registeredRound.find(r => r.id === round.id)) {
            this.log('debug', `Status start following round ~~${round.id}~~`);
            this.registeredRound.push(round);
        }
    }

    stopFollowRound(id: string) {
        this.log('debug', `Status stop following round ~~${id}~~`);
        this.registeredRound = this.registeredRound.filter(r => r.id !== id);
    }

    private clearStatusTimeout() {
        if (this.statusTimeout) clearTimeout(this.statusTimeout);
        this.statusTimeout = undefined;
    }

    private setStatusTimeout() {
        if (!this.enabled) return;

        const defaultTimeout = STATUS_TIMEOUT[this.mode];
        const half = defaultTimeout / 2;

        // get deadlines from registered rounds
        // set minimum deadline to half of defaultTimeout to avoid http request overflow
        const nearestDeadlines = this.registeredRound
            .map(r => r.phaseDeadline - Date.now())
            .map(r => Math.max(r, half));

        const timeout =
            this.mode !== 'idle' ? Math.min(...nearestDeadlines, defaultTimeout) : defaultTimeout;

        this.timestamp = Date.now();
        this.nextTimestamp = this.timestamp + timeout;

        this.log('debug', `Next status fetch in ${timeout}ms`);

        this.statusTimeout = setTimeout(() => {
            this.getStatus()
                .catch(error => {
                    // silent error. do not interrupt the lifecycle
                    this.log('warn', `Status: ${error.message}`);
                })
                .finally(() => {
                    // single status request might fail (no scheduled attempts are set)
                    // continue lifecycle regardless of the result until this.enabled
                    this.setStatusTimeout();
                });
        }, timeout);
    }

    private processStatus(status: coordinator.CoinjoinStatus) {
        // add matching coinjoinRequest to rounds
        status.RoundStates.forEach(round => {
            const roundRequest = status.AffiliateInformation?.AffiliateData[round.Id];
            round.AffiliateRequest = roundRequest?.trezor;
        });

        // report affiliate server status
        const runningAffiliateServer =
            !!status.AffiliateInformation?.RunningAffiliateServers.includes('trezor');
        if (this.runningAffiliateServer !== runningAffiliateServer) {
            this.emit('affiliate-server', runningAffiliateServer);
        }
        this.runningAffiliateServer = runningAffiliateServer;

        const changed = this.compareStatus(status.RoundStates);
        if (changed.length > 0) {
            const statusEvent = {
                changed,
                ...transformStatus(status),
            };

            this.emit('update', statusEvent);
            this.rounds = status.RoundStates;

            return statusEvent;
        }
    }

    isAffiliateServerRunning() {
        return this.runningAffiliateServer;
    }

    async getStatus() {
        if (!this.enabled) return Promise.resolve();

        const identity = this.identities[Math.floor(Math.random() * this.identities.length)];
        const status = await coordinator.getStatus({
            baseUrl: this.settings.coordinatorUrl,
            signal: this.abortController.signal,
            identity,
        });

        // for easier debugging explicitly catch and log processStatus errors
        try {
            return this.processStatus(status);
        } catch (error) {
            this.log('error', `Status processing ${error.message}`);
            throw new Error(`Status processing ${error.message}`);
        }
    }

    private async getVersion() {
        const version = await coordinatorRequest<coordinator.SoftwareVersion>(
            'api/Software/versions',
            undefined,
            {
                method: 'GET',
                baseUrl: this.settings.wabisabiBackendUrl,
                signal: this.abortController.signal,
                identity: this.identities[0],
                attempts: 3, // schedule 3 attempts on start
            },
        ).then(patchResponse);

        return version
            ? ({
                  majorVersion: version.BackenMajordVersion,
                  commitHash: version.CommitHash,
                  legalDocumentsVersion: version.Ww2LegalDocumentsVersion,
              } as CoinjoinClientVersion)
            : undefined;
    }

    async start() {
        this.abortController = new AbortController();
        this.enabled = true;

        try {
            const version = await this.getVersion();
            if (!version) throw new Error('Coordinator api version is missing on start');

            const status = await this.getStatus();
            if (!status) throw new Error('Status not processed on start');

            // start lifecycle only if status is present
            this.setStatusTimeout();

            return { success: true as const, ...status, version };
        } catch (error) {
            return { success: false as const, error: error.message };
        }
    }

    stop() {
        this.abortController.abort();
        this.enabled = false;
        this.removeAllListeners();
        this.clearStatusTimeout();
        this.rounds = [];
    }
}
