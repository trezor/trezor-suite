/// <reference lib="webworker" />

declare let self: SharedWorkerGlobalScope;

interface ChannelEntry {
    port: MessagePort;
    lastHeartbeat: number;
}

const channels = new Map<string, ChannelEntry[]>();
const portToChannel = new WeakMap<MessagePort, string>();

const HEARTBEAT_CHECK_INTERVAL = 3000;
const HEARTBEAT_TIMEOUT = 6000;

const removePort = (port: MessagePort, notify: boolean) => {
    const channelId = portToChannel.get(port);
    if (!channelId) return;

    const entries = channels.get(channelId);
    if (!entries) return;

    const filtered = entries.filter(e => e.port !== port);
    if (filtered.length === 0) {
        channels.delete(channelId);
    } else {
        channels.set(channelId, filtered);
        if (notify) {
            for (const entry of filtered) {
                entry.port.postMessage({ type: 'peer-disconnected' });
            }
        }
    }
    portToChannel.delete(port);
};

self.onconnect = event => {
    const port = event.ports[0];

    console.log('Port connected to shared worker', port);

    port.addEventListener('message', e => {
        const { data } = e;

        if (data.type === 'channel-join') {
            const { channelId } = data;
            portToChannel.set(port, channelId);
            const entries = channels.get(channelId) || [];
            entries.push({ port, lastHeartbeat: Date.now() });
            channels.set(channelId, entries);

            return;
        }

        if (data.type === 'heartbeat') {
            const channelId = portToChannel.get(port);
            if (!channelId) return;

            const entries = channels.get(channelId);
            const entry = entries?.find(e => e.port === port);
            if (entry) entry.lastHeartbeat = Date.now();

            return;
        }

        if (data.type === 'channel-leave') {
            removePort(port, false);

            return;
        }

        const channelId = portToChannel.get(port);
        if (!channelId) return;

        const entries = channels.get(channelId);
        if (!entries) return;

        for (const entry of entries) {
            if (entry.port !== port) {
                entry.port.postMessage(data);
            }
        }
    });

    port.start();
};

setInterval(() => {
    const now = Date.now();
    for (const [, entries] of channels) {
        for (const entry of [...entries]) {
            if (now - entry.lastHeartbeat > HEARTBEAT_TIMEOUT) {
                removePort(entry.port, true);
            }
        }
    }
}, HEARTBEAT_CHECK_INTERVAL);
