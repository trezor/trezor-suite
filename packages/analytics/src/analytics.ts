import { encodeDataToQueryString, getRandomId, getUrl, reportEvent } from './utils';
import type {
    InitOptions,
    Event as AnalyticsEvent,
    App,
    ReportConfig,
    AnalyticsOptions,
} from './types';

export class Analytics<T extends AnalyticsEvent> {
    private enabled = false;

    private useQueue = false;
    private queue = new Array<T>();

    private version: string;
    private app: App;

    private instanceId?: string;
    private sessionId?: string;
    private commitId?: string;
    private url?: string;

    private callbacks?: InitOptions['callbacks'];

    constructor({ version, app, useQueue = false }: AnalyticsOptions) {
        this.version = version;
        this.app = app;
        this.useQueue = useQueue;
    }

    public init = (enabled: boolean, options: InitOptions) => {
        this.enabled = enabled;

        this.instanceId = options.instanceId || getRandomId();
        this.sessionId = options.sessionId || getRandomId();
        this.commitId = options.commitId;
        this.url = getUrl(this.app, options.isDev, options.environment);
        this.callbacks = options.callbacks;

        // queue should not be used if analytics is enabled in initialization
        this.useQueue = !enabled && !!options.useQueue;
    };

    public enable = () => {
        this.enabled = true;

        this.callbacks?.onEnable?.();

        if (this.useQueue) {
            this.queue.map(data => this.report(data));
            this.useQueue = false;
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

    public isEnabled = () => this.enabled;

    public report = (data: T, config?: ReportConfig) => {
        if (!this.url || !this.instanceId || !this.sessionId || !this.commitId || !this.version) {
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

        if (this.useQueue && !this.enabled && !force) {
            this.queue.push(data);
        }

        if (!this.enabled && !force) {
            return;
        }

        const qs = encodeDataToQueryString(
            // Random ID is better than constant because it helps clean the data in case it is accidentally logged multiple times.
            anonymize ? getRandomId() : this.instanceId,
            anonymize ? getRandomId() : this.sessionId,
            this.commitId,
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
        });
    };
}
