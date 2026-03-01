import { AbstractMessageChannel, AbstractMessageChannelConstructorParams } from './abstract';

/**
 * Communication channel between:
 * - here: chrome message port (in service worker)
 * - peer: window in popup opened via externallyConnectable
 *
 * Message flow:
 * 1. Service worker calls chrome.tabs.update() with URL hash containing message
 * 2. Popup page receives hashchange event, parses message from URL hash
 * 3. Popup sends response via chrome.runtime.sendMessage()
 * 4. Service worker receives via chrome.runtime.onMessageExternal listener
 */
export class ServiceWorkerWindowExtConnectableChannel<
    IncomingMessages extends { type: string },
> extends AbstractMessageChannel<IncomingMessages> {
    private currentId?: () => Promise<number | undefined> | undefined;
    /**
     * Expected origin (scheme + host) of the popup page.
     * When set, onMessageExternal messages whose sender.tab.url does not
     * start with this origin are silently dropped.  This is a
     * defense-in-depth measure: externally_connectable may match more
     * origins than intended (e.g. wildcards in manifest), so we
     * double-check that only the popup we actually opened can talk to us.
     */
    private allowedOrigin?: string;
    private messageListener?: (
        message: any,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void,
    ) => void;

    /**
     * Serialization chain for outgoing messages.
     *
     * Messages are sent to the popup by updating the tab's URL hash via
     * chrome.tabs.update(). If two updates fire before the popup processes the
     * first hashchange, the browser coalesces them and only the last hash
     * value is seen — earlier messages are silently lost.
     *
     * To prevent this, every send is chained: the next tabs.update() only
     * runs after the previous one completes plus a short settling delay so the
     * popup has time to handle the hashchange event and clean the hash.
     */
    private sendChain: Promise<void> = Promise.resolve();

    /**
     * Minimum gap (ms) between consecutive chrome.tabs.update() calls.
     * Gives the popup time to process the hashchange event and clear the hash
     * via history.replaceState() before the next message arrives.
     */
    private static SEND_SETTLE_MS = 100;

    constructor({
        channel,
        logger,
        currentId,
        allowedOrigin,
    }: Pick<AbstractMessageChannelConstructorParams, 'channel' | 'logger'> & {
        currentId?: () => Promise<number | undefined> | undefined;
        allowedOrigin?: string;
    }) {
        super({
            channel,
            sendFn: (message: any) => {
                // Enqueue message into the serialization chain.
                // Each send waits for the previous one to finish + settle time.
                this.sendChain = this.sendChain
                    .catch(() => {})
                    .then(() => this.doSend(message))
                    .then(
                        () =>
                            new Promise(resolve =>
                                setTimeout(
                                    resolve,
                                    ServiceWorkerWindowExtConnectableChannel.SEND_SETTLE_MS,
                                ),
                            ),
                    );
            },
            logger,
        });

        this.currentId = currentId;
        this.allowedOrigin = allowedOrigin;
    }

    /**
     * Send a single message to the popup via URL hash update.
     *
     * The popup window listens for hashchange events and parses the message
     * from the URL hash. This is the only direction available because a service
     * worker cannot use chrome.runtime.sendMessage to reach a regular web page.
     *
     * The reverse direction (popup → service worker) uses
     * chrome.runtime.sendMessage() which the service worker receives via its
     * onMessageExternal listener.
     */
    private async doSend(message: any): Promise<void> {
        try {
            const tabId = await this.currentId?.();
            this.logger?.debug('CHANNEL sending to tab:', tabId, 'message:', message);

            if (!tabId) {
                this.logger?.error('CHANNEL: No tab ID available, cannot send message');
                throw new Error('No tab ID available');
            }

            if (!message.id) {
                this.logger?.warn(
                    'CHANNEL: Message without ID, this might cause issues with response handling',
                    message,
                );
            }

            // Get the current tab to preserve its URL.
            // Note: tab.url is accessible because the manifest declares host_permissions
            // for the popup's origin. This is preferred over the broad "tabs" permission
            // which would expose URL info for all tabs.
            const tab = await Promise.race([
                new Promise<chrome.tabs.Tab>((resolve, reject) => {
                    chrome.tabs.get(tabId, t => {
                        if (chrome.runtime.lastError) {
                            this.logger?.error(
                                'CHANNEL: Error getting tab:',
                                chrome.runtime.lastError,
                            );
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(t);
                        }
                    });
                }),
                new Promise<chrome.tabs.Tab>((_, reject) =>
                    setTimeout(() => reject(new Error('chrome.tabs.get timeout after 5s')), 5000),
                ),
            ]);

            if (!tab?.url) {
                throw new Error(
                    'Trezor suite tab URL not available, the manifest must declare host_permissions matching the popup origin',
                );
            }

            const currentUrl = new URL(tab.url);
            const encodedMessage = encodeURIComponent(JSON.stringify(message));

            // todo: we should negotiate some token and send it instead of extension-id I think.
            //       maybe there are some security implications?
            //       on the other hand - extensions already have access to all tabs and can inject scripts etc. so maybe it does not matter.
            currentUrl.hash = `#extension-id=${chrome.runtime.id}&message=${encodedMessage}`;

            chrome.tabs.update(tabId, {
                url: currentUrl.toString(),
            });
        } catch (error) {
            this.logger?.error('CHANNEL: Error sending message via tab update:', error);
            throw error;
        }
    }

    /**
     * Reset the serialization chain so that the very next send goes out
     * immediately instead of waiting behind previously queued messages and
     * their settle delays.  Called before sending urgent messages such as
     * cancel / POPUP.CLOSED.
     *
     * Note: we intentionally do NOT resolve pending message promises here.
     * The popup will receive the cancel message and respond with a properly
     * typed error (e.g. Method_Cancel). If the popup dies before responding,
     * the close monitor in the Popup class will call emitClosed() which
     * resolves promises with Method_Interrupted.
     */
    override clearPendingSends(): void {
        this.sendChain = Promise.resolve();
    }

    connect() {
        // Prevent duplicate listeners
        if (this.messageListener) {
            this.logger?.debug('CHANNEL: Listener already registered, skipping');

            return;
        }

        this.logger?.debug('CHANNEL: connect called, setting up onMessageExternal listener');

        this.messageListener = (message, sender, sendResponse) => {
            this.logger?.debug('CHANNEL: onMessageExternal fired:', { message, sender });

            // Only accept messages originating from a web page tab
            if (!sender.tab) {
                this.logger?.warn('CHANNEL: Received message not from a tab, ignoring', sender);

                return false;
            }

            // Defense-in-depth: verify the sender's page origin matches the
            // popup we opened.  externally_connectable patterns may be broader
            // than our popup URL (e.g. wildcard sub-domains), so this ensures
            // only the exact popup origin is accepted.
            if (
                this.allowedOrigin &&
                sender.tab.url &&
                !sender.tab.url.startsWith(this.allowedOrigin)
            ) {
                this.logger?.warn(
                    `CHANNEL: Sender origin mismatch — expected ${this.allowedOrigin}, got ${sender.tab.url}. Ignoring.`,
                );

                return false;
            }

            // Verify message comes from the correct extension context
            if (!message.channel) {
                this.logger?.warn('CHANNEL: Received message without channel info, ignoring');
                sendResponse({ error: 'Missing channel info' });

                return false;
            }

            this.logger?.debug('CHANNEL: Processing message through onMessage');
            this.onMessage(message);
        };

        chrome.runtime.onMessageExternal.addListener(this.messageListener);
        this.isConnected = true;
        this.logger?.debug('CHANNEL: Listener registered successfully');
    }

    disconnect() {
        if (!this.isConnected) return;

        // Remove the listener if it was registered
        if (this.messageListener) {
            chrome.runtime.onMessageExternal.removeListener(this.messageListener);
            this.messageListener = undefined;
        }

        this.clear();
        this.isConnected = false;
    }
}
