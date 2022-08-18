import { EventEmitter } from 'events';
import path from 'path';

import { createTimeoutPromise } from '@trezor/utils';

import { TorControlPort } from './torControlPort';
import type { TorConnectionOptions, BootstrapEvent } from './types';
import { BootstrapEventProgress, bootstrapParser } from './events/bootstrap';

export class TorController extends EventEmitter {
    options: TorConnectionOptions;
    controlPort: TorControlPort;
    waitingTime = 1000;
    maxTriesWaiting = 60;
    isCircuitEstablished = false;
    torIsDisabledWhileStarting: boolean;

    constructor(options: TorConnectionOptions) {
        super();
        this.options = options;
        this.torIsDisabledWhileStarting = false;
        this.controlPort = new TorControlPort(options, this.onMessageReceived.bind(this));
    }

    getTorConfiguration(processId: number): string[] {
        const controlAuthCookiePath = path.join(this.options.authFilePath, 'control_auth_cookie');
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
            '--SocksPort',
            `${this.options.port}`,
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
        ];
    }

    onMessageReceived(message: string) {
        const bootstrap: BootstrapEvent[] = bootstrapParser(message);
        bootstrap.forEach(event => {
            if (!event?.progress) return;
            this.isCircuitEstablished = event.progress === BootstrapEventProgress.Done;
            this.emit('bootstrap/event', event);
        });
    }

    waitUntilAlive(): Promise<void> {
        const errorMessages: string[] = [];
        this.torIsDisabledWhileStarting = false;
        const waitUntilResponse = async (triesCount: number): Promise<void> => {
            if (this.torIsDisabledWhileStarting) {
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
                if (isConnected && isAlive && this.isCircuitEstablished) {
                    // It is running so let's not wait anymore.
                    return;
                }
            } catch (error) {
                // Some error here is expected when waiting but
                // we do not want to throw untill maxTriesWaiting is reach.
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

    status() {
        return this.controlPort.ping();
    }

    stopWhileLoading() {
        this.torIsDisabledWhileStarting = true;
    }
}
