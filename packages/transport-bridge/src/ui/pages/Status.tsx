import React, { useEffect, useRef, useState } from 'react';

// todo: direct imports to avoid SyntaxError: Unexpected token '<' from svgs
import { H1 } from '@trezor/components/src/components/typography/Heading/Heading';

import { Card } from '../components/Card';
import { Devices, DevicesProps } from '../components/Devices';
import { Logs, LogsProps } from '../components/Logs';
import { Translation } from '../components/Translation';

export type StatusProps = LogsProps &
    DevicesProps & {
        version: string;
        bundledVersion?: string;
    };

interface DebugSnapshot {
    version: string;
    bundledVersion?: string;
    serviceName: string;
    port: number;
    wsEndpoint: string;
    startedAt: number;
    uptimeMs: number;
    counts: {
        httpDescriptors: number;
        sessionsDescriptors: number;
        wsClients: number;
        listenSubscriptions: number;
    };
    clients: { origin?: string; isAlive: boolean; subscriptions: string[] }[];
    descriptors: {
        http: any[];
        sessions: any[];
        api?: any[];
    };
    devices?: any[]; // alias for descriptors.http
    logs?: any[];
    sessions: {
        wsUrl?: string;
        wsConnected: boolean;
        descriptorsCount: number;
        lastSessionId: number;
        locksQueueSize: number;
        descriptors?: { path: string; session?: string | null; sessionOwner?: string }[];
    };
}

export const Status = () => {
    const [data, setData] = useState<StatusProps | undefined>(undefined);
    const [debug, setDebug] = useState<DebugSnapshot | undefined>(undefined);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // WebSocket only: server sends initial bridge-status immediately plus periodic updates
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = ev => {
            try {
                const msg = JSON.parse(ev.data);
                if (msg?.type === 'bridge-status') {
                    setDebug(msg.payload);
                    if (!data) {
                        setData({
                            version: msg.payload.version,
                            bundledVersion: msg.payload.bundledVersion,
                            devices: msg.payload.descriptors.http,
                            logs: msg.payload.logs,
                        });
                    } else {
                        setData({
                            ...data,
                            devices: msg.payload.descriptors.http,
                            logs: msg.payload.logs,
                        });
                    }
                }
                if (msg?.type === 'transport-descriptors' && data) {
                    setData({ ...data, devices: msg.payload });
                }
                if (msg?.type === 'sessions-descriptors' && debug) {
                    setDebug({
                        ...debug,
                        descriptors: { ...debug.descriptors, sessions: msg.payload },
                    });
                }
            } catch {
                /* ignore */
            }
        };

        return () => {
            wsRef.current?.close();
        };
    }, []);

    if (!data) return null;

    const { version, bundledVersion, devices, logs } = data;

    return (
        <div>
            <H1>
                <Translation id="heading" />
            </H1>
            <Card>
                <div>
                    <Translation id="version" />: {version}{' '}
                    {bundledVersion && `(bundled in Trezor Suite ${bundledVersion})`}
                </div>
                <Translation id="bridge.description" />
            </Card>

            <Devices devices={devices} />

            {debug && (
                <Card>
                    <div style={{ fontFamily: 'monospace' }}>
                        <div>Real-time status (websocket)</div>
                        <div>Uptime: {(debug.uptimeMs / 1000).toFixed(1)}s</div>
                        <div>WS clients: {debug.counts.wsClients}</div>
                        <div>Sessions descriptors: {debug.counts.sessionsDescriptors}</div>
                        <div>Session last id: {debug.sessions.lastSessionId}</div>
                        <div>Locks queue size: {debug.sessions.locksQueueSize}</div>
                        {debug.sessions.descriptors && (
                            <div>
                                <div>Session Owners:</div>
                                {debug.sessions.descriptors.map(d => (
                                    <div key={d.path}>
                                        path={d.path} session={d.session ?? 'none'} owner=
                                        {d.sessionOwner ?? 'none'}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <Logs logs={logs} />
        </div>
    );
};
