import { encodeDataToQueryString, getRandomId, getUrl } from './utils';
import type { InitOptions, Event, App } from './types';

export class Analytics<T extends Event> {
    private enabled = false;

    private version: string;
    private app: App;

    private instanceId?: string;
    private sessionId?: string;
    private commitId?: string;
    private url?: string;

    private callbacks?: InitOptions['callbacks'];

    constructor(version: string, app: App) {
        this.version = version;
        this.app = app;
    }

    public init = (enabled: boolean, options: InitOptions) => {
        this.enabled = enabled;

        this.instanceId = options.instanceId || getRandomId();
        this.sessionId = options.sessionId || getRandomId();
        this.commitId = options.commitId;
        this.url = getUrl(this.app, options.environment, options.isDev);
        this.callbacks = options.callbacks;
    };

    public enable = () => {
        this.enabled = true;

        this.callbacks?.onEnable?.();
    };

    public disable = () => {
        this.enabled = false;

        this.callbacks?.onDisable?.();
    };

    public isEnabled = () => this.enabled;

    public report = (data: T, force = false) => {
        if (!this.url || !this.instanceId || !this.sessionId || !this.commitId || !this.version) {
            console.error('Unable to report. Analytics is not initialized');
            return;
        }

        if (!this.enabled && !force) {
            return;
        }

        const qs = encodeDataToQueryString(
            this.instanceId,
            this.sessionId,
            this.commitId,
            this.version,
            data,
        );

        try {
            fetch(`${this.url}?${qs}`, {
                method: 'GET',
            });
        } catch (err) {
            console.error('Failed to log analytics', err);
        }
    };
}
