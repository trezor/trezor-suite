import { initLog } from './debug';

const _log = initLog('InteractionTimeout');

type TimeoutID = any;

export class InteractionTimeout {
    timeout?: TimeoutID | null = null;

    seconds = 0;

    constructor(seconds?: number) {
        if (seconds) {
            this.seconds = seconds;
        }
    }

    /**
     * Start the interaction timer.
     * The timer will fire the cancel function once reached
     * @param {function} cancelFn Function called once the timeout is reached
     * @param {number} seconds Optional parameter to override the seconds property
     * @returns {void}
     */
    start(cancelFn: () => void, seconds?: number) {
        const time = seconds || this.seconds;

        // Not worth running for less than a second
        if (time < 1) {
            return;
        }

        // Clear any previous timeouts set (reset)
        this.stop();

        _log.debug(`starting interaction timeout for ${time} seconds`);
        this.timeout = setTimeout(() => {
            _log.debug('interaction timed out');
            cancelFn();
        }, 1000 * time);
    }

    /**
     * Stop the interaction timer
     * @returns {void}
     */
    stop() {
        if (this.timeout) {
            _log.debug('clearing interaction timeout');
            clearTimeout(this.timeout);
        }
    }
}
