import { EventEmitter } from 'events';
import path from 'path';

import { createTimeoutPromise } from '@trezor/utils';

import { TorControlPort } from './torControlPort';
import {
    TorConnectionOptions,
    BootstrapEvent,
    TorControllerStatus,
    TOR_CONTROLLER_STATUS,
} from './types';
import { bootstrapParser, BOOTSTRAP_EVENT_PROGRESS } from './events/bootstrap';

export class TorController extends EventEmitter {
    options: TorConnectionOptions;
    controlPort: TorControlPort;
    bootstrapSlownessChecker?: NodeJS.Timeout;
    status: TorControllerStatus = TOR_CONTROLLER_STATUS.Stopped;
    // Configurations
    waitingTime = 1000;
    maxTriesWaiting = 200;
    bootstrapSlowThreshold = 1000 * 5; // 5 seconds.

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
        // When Bootstrap starts we wait time defined in bootstrapSlowThreshold and if after that time,
        // it has not being finalized, then we send slow event. We know that Bootstrap is going on since
        // we received, at least, first Bootstrap events from ControlPort.
        this.bootstrapSlownessChecker = setTimeout(() => {
            this.emit('bootstrap/event', {
                type: 'slow',
            });
        }, this.bootstrapSlowThreshold);
    }

    public getTorConfiguration(processId: number): string[] {
        const controlAuthCookiePath = path.join(this.options.torDataDir, 'control_auth_cookie');

        // https://github.com/torproject/tor/blob/bf30943cb75911d70367106af644d4273baaa85d/doc/man/tor.1.txt
        return [
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
    }

    public onMessageReceived(message: string) {
        const bootstrap: BootstrapEvent[] = bootstrapParser(message);
        bootstrap.forEach(event => {
            if (event.type !== 'progress') return;
            if (event.progress && !this.getIsBootstrapping()) {
                // We consider that bootstrap has started when we receive any bootstrap event and
                // Tor is not bootstrapping yet.
                // If we do not receive any bootstrapping event, we can consider there is something going wrong and
                // an error will be thrown when `maxTriesWaiting` is reached in `waitUntilAlive`.
                this.startBootstrap();
            }
            if (event.progress === BOOTSTRAP_EVENT_PROGRESS.Done) {
                this.successfullyBootstrapped();
            }
            this.emit('bootstrap/event', event);
        });
    }

    public waitUntilAlive(): Promise<void> {
        const errorMessages: string[] = [];
        this.status = TOR_CONTROLLER_STATUS.Bootstrapping;
        const waitUntilResponse = async (triesCount: number): Promise<void> => {
            if (this.getIsStopped()) {
                // If TOR is starting and we want to cancel it.
                return;
            }
            if (triesCount >= this.maxTriesWaiting) {
                throw new Error(
                    `Timeout waiting for TOR control port: \n${errorMessages.join('\n')}`,
                );
            }
            try {
                const isConnected = await this.controlPort.connect();
                const isAlive = this.controlPort.ping();
                if (isConnected && isAlive && this.getIsCircuitEstablished()) {
                    // It is running so let's not wait anymore.
                    return;
                }
            } catch (error) {
                // Some error here is expected when waiting but
                // we do not want to throw until maxTriesWaiting is reach.
                // Instead we want to log it to know what causes the error.
                if (error && error.message) {
                    console.warn('request-manager:', error.message);
                    errorMessages.push(error.message);
                }
            }
            await createTimeoutPromise(this.waitingTime);

            return waitUntilResponse(triesCount + 1);
        };

        return waitUntilResponse(1);
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
