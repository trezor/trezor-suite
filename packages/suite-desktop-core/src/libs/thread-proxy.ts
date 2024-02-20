import path from 'path';
import { EventEmitter } from 'events';
import { UtilityProcess, utilityProcess } from 'electron';

import { createDeferred, Deferred, promiseAllSequence } from '@trezor/utils';

import { isValidThreadResponse, isValidThreadEvent, ThreadRequestType } from './thread';

const THREADS_DIR_PATH = path.join(__dirname, 'threads');

type ThreadProxySettings = {
    name: string;
    keepAlive?: boolean;
};

/**
 * Proxy class for communicating with proxied objects in Electron's utility processes
 * from the Electron's main process. Should be instantiated only in main process.
 */
export class ThreadProxy<_Target extends object> extends EventEmitter {
    private readonly settings;
    private utility: UtilityProcess | undefined;

    get running() {
        return !!this.utility;
    }

    /**
     * @param settings.name file name (without extension) of the corresponding file in `suite-desktop/src/threads`
     * @param settings.keepAlive if true, tries to respawn the process immediately when it unexpectedly exits
     */
    constructor(settings: ThreadProxySettings) {
        super();
        this.settings = Object.freeze(settings);
    }

    /**
     * If not running already, tries to instantiate the proxied object (from file defined in `settings.name`)
     * with given `params` as a utility process.
     *
     * If `settings.keepAlive` is set, recalls itself immediately when
     * the process exited, until `dispose()` is called from outside.
     *
     * @returns `true` if process was spawned successfully, throws otherwise
     */
    async run(params: any): Promise<true> {
        if (this.utility) throw new Error('Process already running');
        const utilityPath = path.join(THREADS_DIR_PATH, `${this.settings.name}.js`);
        const utility = utilityProcess.fork(utilityPath);
        await new Promise((resolve, reject) => {
            utility.once('spawn', resolve);
            utility.once('exit', reject);
        });
        utility.once('exit', this.clean.bind(this));
        utility.on('message', this.onMessage.bind(this));
        // Process is considered running as long as `this.utility` is set, so `exit` event
        // should always trigger `clean()` which will unset it
        this.utility = utility;
        try {
            await this.sendMessage('init', params);
            await promiseAllSequence(
                // Resubscribe to formerly subscribed events (in case of reviving the process because of `keepAlive`)
                this.eventNames().map(event => () => this.sendMessage('subscribe', { event })),
            );
            if (this.settings.keepAlive) {
                // In case of `keepAlive`, replace the clean alone with clean + rerun as an exit handler
                utility.removeAllListeners('exit');
                utility.once('exit', () => {
                    this.clean();

                    return this.run(params);
                });
            }

            return true;
        } catch (e) {
            // No need to unset `this.utility` because kill will trigger `clean()`
            this.utility.kill();
            throw e;
        }
    }

    /** Removes all the listeners and kills the process (ignoring possible `keepAlive`) */
    dispose() {
        this.emit('disposed');
        super.removeAllListeners();
        const { utility } = this;
        utility?.removeAllListeners();
        this.clean();

        return utility?.kill() ?? false;
    }

    /** Call `method` on proxied object with given `params` and return its return value */
    request(method: string, params: any[]) {
        return this.sendMessage('call', { method, params });
    }

    /** Subscribe the `listener` to proxied object's `event` */
    on(event: string | symbol, listener: (...args: any[]) => void) {
        super.on(event, listener);
        this.sendMessage('subscribe', { event });

        return this;
    }

    /**  Unsubscribe all listeners from proxied object's `event` */
    removeAllListeners(event?: string | symbol | undefined) {
        super.removeAllListeners(event);
        this.sendMessage('unsubscribe', { event });

        return this;
    }

    private messageId = 0;
    private readonly promises = new Map<number, Deferred<any>>();

    private sendMessage(type: ThreadRequestType, payload?: any) {
        if (!this.utility) throw new Error('Process not running');
        const id = this.messageId++;
        const dfd = createDeferred<any, number>(id);
        this.promises.set(id, dfd);
        this.utility.postMessage({ id, type, payload });

        return dfd.promise;
    }

    private onMessage(message: any) {
        if (isValidThreadResponse(message)) {
            const promise = this.promises.get(message.id);
            if (promise) {
                this.promises.delete(message.id);
                if (message.success) {
                    promise.resolve(message.payload);
                } else {
                    promise.reject(new Error(message.error));
                }
            }
        } else if (isValidThreadEvent(message)) {
            this.emit(message.event, message.payload);
        }
    }

    private clean() {
        this.promises.forEach(({ reject }) => reject(new Error('Process exited')));
        this.promises.clear();
        this.utility = undefined;
    }
}
