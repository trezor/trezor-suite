import { EventEmitter } from 'events';
import path from 'path';

import { ScheduleActionParams, ScheduledAction, scheduleAction } from '@trezor/utils';
import { checkFileExists } from '@trezor/node-utils';

import { TorControlPort } from './torControlPort';
import {
    TorConnectionOptions,
    BootstrapEvent,
    TorControllerStatus,
    TOR_CONTROLLER_STATUS,
} from './types';
import { bootstrapParser, BOOTSTRAP_EVENT_PROGRESS } from './events/bootstrap';

const WAITING_TIME = 1000;
const MAX_TRIES_WAITING = 200;
const BOOTSTRAP_SLOW_TRESHOLD = 1000 * 5; // 5 seconds.

export class TorController extends EventEmitter {
    options: TorConnectionOptions;
    controlPort: TorControlPort;
    bootstrapSlownessChecker?: NodeJS.Timeout;
    status: TorControllerStatus = TOR_CONTROLLER_STATUS.Stopped;

    constructor(options: TorConnectionOptions) {
        super();
        this.options = options;
        this.controlPort = new TorControlPort(options, this.onMessageReceived.bind(this));
    }

    private getIsCircuitEstablished() {
        // We rely on TOR_CONTROLLER_STATUS but check controlPort is actives as sanity check.
        return this.controlPort.ping() && this.status === TOR_CONTROLLER_STATUS.CircuitEstablished;
    }

    private getIsStopped() {
        return this.status === TOR_CONTROLLER_STATUS.Stopped;
    }

    private getIsBootstrapping() {
        // We rely on TOR_CONTROLLER_STATUS but check controlPort is actives as sanity check.
        return this.controlPort.ping() && this.status === TOR_CONTROLLER_STATUS.Bootstrapping;
    }

    private successfullyBootstrapped() {
        this.status = TOR_CONTROLLER_STATUS.CircuitEstablished;
        this.stopBootstrapSlowChecker();
    }

    private stopBootstrapSlowChecker() {
        clearTimeout(this.bootstrapSlownessChecker);
    }

    private startBootstrap() {
        this.status = TOR_CONTROLLER_STATUS.Bootstrapping;
        if (this.bootstrapSlownessChecker) {
            clearTimeout(this.bootstrapSlownessChecker);
        }
        // When Bootstrap starts we wait time defined in BOOTSTRAP_SLOW_TRESHOLD and if after that time,
        // it has not being finalized, then we send slow event. We know that Bootstrap is going on since
        // we received, at least, first Bootstrap events from ControlPort.
        this.bootstrapSlownessChecker = setTimeout(() => {
            this.emit('bootstrap/event', {
                type: 'slow',
            });
        }, BOOTSTRAP_SLOW_TRESHOLD);
    }

    private onMessageReceived(message: string) {
        const bootstrap: BootstrapEvent[] = bootstrapParser(message);
        bootstrap.forEach(event => {
            if (event.type !== 'progress') return;
            if (event.progress && !this.getIsBootstrapping()) {
                // We consider that bootstrap has started when we receive any bootstrap event and
                // Tor is not bootstrapping yet.
                // If we do not receive any bootstrapping event, we can consider there is something going wrong and
                // an error will be thrown when `MAX_TRIES_WAITING` is reached in `waitUntilAlive`.
                this.startBootstrap();
            }
            if (event.progress === BOOTSTRAP_EVENT_PROGRESS.Done) {
                this.successfullyBootstrapped();
            }
            this.emit('bootstrap/event', event);
        });
    }

    public async getTorConfiguration(
        processId: number,
        snowflakeBinaryPath?: string,
    ): Promise<string[]> {
        const { torDataDir } = this.options;
        const controlAuthCookiePath = path.join(torDataDir, 'control_auth_cookie');
        const snowflakeLogPath = path.join(torDataDir, 'snowflake.log');

        // https://github.com/torproject/tor/blob/bf30943cb75911d70367106af644d4273baaa85d/doc/man/tor.1.txt
        const config: string[] = [
            // Try to write to disk less frequently than we would otherwise.
            '--AvoidDiskWrites',
            '1',
            // Send all messages between minSeverity and maxSeverity to the standard output stream.
            'Log',
            'notice stdout',
            // It should treat a startup event as cancelling any previous dormant state.
            // use this option with caution: it should only be used if Tor is being started because
            // of something that the user did, and not if Tor is being automatically started in the background.
            '--DormantCanceledByStartup',
            '1',
            // Open this port to listen for connections from SOCKS-speaking applications.
            // **ExtendedErrors** return extended error code in the SOCKS reply.
            // **KeepAliveIsolateSOCKSAuth** keep alive circuits while they have at least
            // one stream with SOCKS authentication active. After such a circuit is idle
            // for more than MaxCircuitDirtiness seconds.
            '--SocksPort',
            `${this.options.port} ExtendedErrors KeepAliveIsolateSOCKSAuth`,
            // Let a socks connection wait NUM seconds handshaking, and NUM seconds
            // unattached waiting for an appropriate circuit, before we fail it. (Default:
            // 2 minutes)
            '--SocksTimeout',
            '30', // Waits 30 seconds to build one circuit until it tries new one.
            // Feel free to reuse a circuit that was first used at most NUM seconds ago,
            // but never attach a new stream to a circuit that is too old.  For hidden
            // services, this applies to the __last__ time a circuit was used, not the
            // first. Circuits with streams constructed with SOCKS authentication via
            // SocksPorts that have **KeepAliveIsolateSOCKSAuth** also remain alive
            // for MaxCircuitDirtiness seconds after carrying the last such stream.
            // (Default: 10 minutes)
            '--MaxCircuitDirtiness',
            '1800', // 30 minutes
            // The port on which Tor will listen for local connections from Tor controller applications.
            '--ControlPort',
            `${this.options.controlPort}`,
            // Setting CookieAuthentication will make Tor write an authentication cookie.
            '--CookieAuthentication',
            '1',
            // If the 'CookieAuthentication' option is true, Tor writes a "magic
            // cookie" file named "control_auth_cookie" into its data directory (or
            // to another file specified in the 'CookieAuthFile' option)
            // To authenticate, the controller must demonstrate that it can read the
            // contents of the cookie file:
            '--CookieAuthFile',
            `${controlAuthCookiePath}`,
            // Tor will periodically check whether a process with the specified PID exists, and exit if one does not.
            // Once the controller has connected to Tor's control port, it should send the TAKEOWNERSHIP command along its control
            // connection. At this point, *both* the TAKEOWNERSHIP command and the __OwningControllerProcess option are in effect:
            // Tor will exit when the control connection ends *and* Tor will exit if it detects that there is no process with
            // the PID specified in the __OwningControllerProcess option.
            '__OwningControllerProcess',
            `${processId}`,
            // Store working data in DIR. It has to be different that default one especially for macOS otherwise the
            // custom Tor process cannot run when there is already a Tor process running.
            // On Windows, the default is your ApplicationData folder.
            '--DataDirectory',
            this.options.torDataDir,
        ];

        let existsSnowflakeBinary = false;
        if (snowflakeBinaryPath && snowflakeBinaryPath.trim() !== '') {
            // If provided snowflake file does not exists, do not use it.
            existsSnowflakeBinary = await checkFileExists(snowflakeBinaryPath);
        }

        if (existsSnowflakeBinary) {
            // Snowflake is a WebRTC pluggable transport for Tor (client)
            // More info:
            // https://gitlab.torproject.org/tpo/anti-censorship/pluggable-transports/snowflake/-/tree/main/client
            // https://packages.debian.org/bookworm/snowflake-client

            const SNOWFLAKE_PLUGIN = 'snowflake exec';
            const SNOWFLAKE_SERVER = 'snowflake 192.0.2.3:80';
            const SNOWFLAKE_FINGERPRINT = '2B280B23E1107BB62ABFC40DDCC8824814F80A72';
            const SNOWFLAKE_URL = 'https://snowflake-broker.torproject.net.global.prod.fastly.net/';
            const SNOWFLAKE_FRONT = 'fronts=foursquare.com,github.githubassets.com';
            const SNOWFLAKE_ICE =
                'ice=stun:stun.l.google.com:19302,stun:stun.antisip.com:3478,stun:stun.bluesip.net:3478,stun:stun.dus.net:3478,stun:stun.epygi.com:3478,stun:stun.sonetel.com:3478,stun:stun.uls.co.za:3478,stun:stun.voipgate.com:3478,stun:stun.voys.nl:3478';
            const SNOWFLAKE_UTLS = 'utls-imitate=hellorandomizedalpn';

            const snowflakeCommand = `${SNOWFLAKE_PLUGIN} ${snowflakeBinaryPath} -log ${snowflakeLogPath}`;
            const snowflakeBridge = `${SNOWFLAKE_SERVER} ${SNOWFLAKE_FINGERPRINT} fingerprint=${SNOWFLAKE_FINGERPRINT} url=${SNOWFLAKE_URL} ${SNOWFLAKE_FRONT} ${SNOWFLAKE_ICE} ${SNOWFLAKE_UTLS}`;

            config.push(
                '--UseBridges',
                '1',
                '--ClientTransportPlugin',
                snowflakeCommand,
                '--Bridge',
                snowflakeBridge,
            );
        }

        return config;
    }

    public async waitUntilAlive(): Promise<void> {
        this.status = TOR_CONTROLLER_STATUS.Bootstrapping;

        const checkConnection: ScheduledAction<boolean> = async () => {
            if (this.getIsStopped()) return false;
            const isConnected = await this.controlPort.connect();
            const isAlive = this.controlPort.ping();
            const isCircuitEstablished = this.getIsCircuitEstablished();
            // It is running so let's not wait anymore.
            if (isConnected && isAlive && isCircuitEstablished) {
                return true;
            }
            throw new Error('Tor not alive');
        };

        const params: ScheduleActionParams = {
            attempts: MAX_TRIES_WAITING,
            timeout: WAITING_TIME,
            gap: WAITING_TIME,
        };

        await scheduleAction(checkConnection, params);
    }

    public getStatus(): Promise<TorControllerStatus> {
        return new Promise(resolve => {
            if (this.getIsCircuitEstablished()) {
                return resolve(TOR_CONTROLLER_STATUS.CircuitEstablished);
            }
            if (this.getIsBootstrapping()) {
                return resolve(TOR_CONTROLLER_STATUS.Bootstrapping);
            }

            return resolve(TOR_CONTROLLER_STATUS.Stopped);
        });
    }

    public closeActiveCircuits() {
        return this.controlPort.closeActiveCircuits();
    }

    public stop() {
        this.status = TOR_CONTROLLER_STATUS.Stopped;
    }
}
