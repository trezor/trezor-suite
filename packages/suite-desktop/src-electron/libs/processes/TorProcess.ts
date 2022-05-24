import path from 'path';
import BaseProcess, { Status } from './BaseProcess';

import { TorController } from '@trezor/request-manager';

interface TorConnectionOptions {
    host: string;
    port: number;
    controlPort: number;
    authFilePath: string;
}

class TorProcess extends BaseProcess {
    torController: TorController;
    port: number;
    controlPort: number;
    torHost: string;
    authFilePath: string;

    constructor(options: TorConnectionOptions) {
        super('tor', 'tor');

        this.port = options.port;
        this.controlPort = options.controlPort;
        this.torHost = options.host;
        this.authFilePath = options.authFilePath;

        this.torController = new TorController({
            host: this.torHost,
            port: this.port,
            controlPort: this.controlPort,
            authFilePath: this.authFilePath,
        });
    }

    async status(): Promise<Status> {
        try {
            const isAlive = await this.torController.status();
            if (isAlive) {
                return {
                    service: true,
                    process: true,
                };
            }
        } catch {
            //
        }

        // process
        return {
            service: false,
            process: Boolean(this.process),
        };
    }

    async start(): Promise<void> {
        const controlAuthCookiePath = path.join(this.authFilePath, 'control_auth_cookie');
        const electronProcessId = process.pid;
        await super.start([
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
            `${this.port}`,
            // The port on which Tor will listen for local connections from Tor controller applications.
            '--ControlPort',
            `${this.controlPort}`,
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
            `${electronProcessId}`,
        ]);
        return this.torController.waitUntilAlive();
    }
}

export default TorProcess;
