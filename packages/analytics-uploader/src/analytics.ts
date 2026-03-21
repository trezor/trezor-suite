import type {
    Event as AnalyticsEvent,
    AnalyticsOptions,
    App,
    InitOptions,
    ReportConfig,
} from './types';
import { encodeDataToQueryString, getRandomId, getUrl, reportEvent } from './utils';

export interface Analytics<T extends AnalyticsEvent> {
    init: (enabled: boolean | undefined, options: InitOptions) => void;
    enable: () => void;
    disable: () => void;
    isEnabled: () => boolean;
    setUrl: (url?: string) => void;
    setLoggerEnabled: (enabled: boolean) => void;
    report: (data: T, config?: ReportConfig) => void;
}

export class QueuedAnalytics<T extends AnalyticsEvent> implements Analytics<T> {
    private enabled: boolean | undefined;

    private useQueue = false;
    private queue = new Array<T>();

    private version: string;
    private app: App;

    private instanceId?: string;
    private sessionId?: string;
    private commitId?: string;
    private isDev?: boolean;
    private environment?: InitOptions['environment'];
    private url?: string;
    private loggerEnabled = false;

    private callbacks?: InitOptions['callbacks'];

    constructor({ version, app, useQueue = false }: AnalyticsOptions) {
        this.version = version;
        this.app = app;
        this.useQueue = useQueue;
    }

    public init = (enabled: boolean | undefined, options: InitOptions) => {
        this.enabled = enabled;

        this.instanceId = options.instanceId || getRandomId();
        this.sessionId = options.sessionId || getRandomId();
        this.commitId = options.commitId;
        this.isDev = options.isDev;
        this.environment = options.environment;
        this.url = options.url ?? getUrl(this.app, options.isDev, options.environment);
        this.loggerEnabled = options.loggerEnabled ?? false;
        this.callbacks = options.callbacks;

        // Call flushQueue only if 'enabled' is explicitly set (true or false).
        // If 'enabled' is undefined, do not call flushQueue since the analytics
        // status (enabled/disabled) will be determined later.
        if (this.enabled !== undefined) {
            this.flushQueue();
        }
    };

    public enable = () => {
        this.enabled = true;

        this.callbacks?.onEnable?.();

        this.flushQueue();
    };

    private flushQueue = () => {
        if (this.useQueue) {
            this.useQueue = false;
            this.queue.map(data => this.report(data));
            this.queue = [];
        }
    };

    public disable = () => {
        this.enabled = false;

        this.callbacks?.onDisable?.();

        if (this.useQueue) {
            this.useQueue = false;
            this.queue = [];
        }
    };

    public isEnabled = () => !!this.enabled;

    public setUrl = (url?: string) => {
        this.url = url ?? getUrl(this.app, this.isDev ?? false, this.environment);
    };

    public setLoggerEnabled = (enabled: boolean) => {
        this.loggerEnabled = enabled;
    };

    public report = (data: T, config?: ReportConfig) => {
        // Add a timestamp to each event to track its actual occurrence time, considering possible queuing delays.
        if (!data.timestamp) {
            data.timestamp = Date.now().toString();
        }

        const isMissingFields =
            !this.url || !this.instanceId || !this.sessionId || !this.commitId || !this.version;

        if (!this.useQueue && isMissingFields) {
            const listOfMissingFields =
                `${!this.url ? 'url, ' : ''}` +
                `${!this.instanceId ? 'instanceId, ' : ''}` +
                `${!this.sessionId ? 'sessionId, ' : ''}` +
                `${!this.commitId ? 'commitId, ' : ''}` +
                `${!this.version ? 'version, ' : ''}`;

            console.error(
                `Unable to report ${data.type}. Analytics is not initialized! Missing: ${listOfMissingFields}`,
            );

            return;
        }

        const { anonymize, force } = config ?? {};

        if (this.useQueue && this.enabled === undefined && !force) {
            this.queue.push(data);
        }

        if ((!this.enabled && !force) || isMissingFields) {
            return;
        }

        const qs = encodeDataToQueryString(
            // Random ID is better than constant because it helps clean the data in case it is accidentally logged multiple times.
            anonymize ? getRandomId() : this.instanceId!,
            anonymize ? getRandomId() : this.sessionId!,
            this.commitId!,
            this.version,
            data,
        );

        // try to report analytics event once again if the previous one fails
        // easy solution which should solve missing events on the launch of the app
        // if it does not help, then queue or more sophisticated solution should be implemented
        reportEvent({
            type: data.type,
            url: `${this.url}?${qs}`,
            options: {
                method: 'GET',
                keepalive: true,
            },
            retry: true,
            loggerEnabled: this.loggerEnabled,
        });
    };
}
