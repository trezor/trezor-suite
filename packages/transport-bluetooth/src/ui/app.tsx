// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useEffect, useRef, useState } from 'react';

import { TrezorBluetooth } from '../client/trezor-bluetooth';
import {
    type BluetoothDevice,
    type NotificationCharacteristic,
    type NotificationEvent,
} from '../client/types';

// Inline CSS (simplified, readable)
const INLINE_CSS = `
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin: 0;
  padding: 12px;
  background: #ffffff;
  color: #111111;
  font-size: 14px;
}

button {
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #cccccc;
  background: #f2f2f2;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

#device-list { padding: 8px; }
.device-list-item { border: 1px solid #ddd; padding: 8px; margin-bottom: 6px; }
#output { max-height: 60vh; overflow: auto; background: #fafafa; padding: 8px; color: #111; }

#send_message_input { width: 100%; height: 80px; }
`;

const getPort = () => {
    // UI served from the server
    if (window.location.port) {
        return window.location.port;
    }
    // UI is running as standalone file
    if (window.location.hash.length > 0) {
        const url = new URL(window.location.href.replace(/#/g, '?'));
        const port = url.searchParams.get('port');
        if (port) {
            return port;
        }
    }

    // default
    return 21327;
};

export const App: React.FC = () => {
    // inject inline styles on mount
    useEffect(() => {
        const style = document.createElement('style');
        style.setAttribute('data-inline', 'transport-bluetooth');
        style.textContent = INLINE_CSS;
        document.head.appendChild(style);

        return () => {
            if (style.parentNode) style.parentNode.removeChild(style);
        };
    }, []);

    const apiRef = useRef<TrezorBluetooth | null>(null);
    const [devices, setDevices] = useState<BluetoothDevice[]>([]);
    const [output, setOutput] = useState<string[]>([]);
    const [deviceId, setDeviceId] = useState('');
    const [connected, setConnected] = useState(false);
    const selectRef = useRef<(HTMLSelectElement & { value?: NotificationCharacteristic }) | null>(
        null,
    );
    const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

    const writeOutput = (message: unknown) => {
        try {
            setOutput(o => [...o, typeof message === 'string' ? message : JSON.stringify(message)]);
        } catch {
            setOutput(o => [...o, `${message}`]);
        }
    };

    useEffect(() => {
        const port = getPort();
        const api = new TrezorBluetooth({ url: `ws://127.0.0.1:${port}/` });
        apiRef.current = api;

        const onDisconnected = () => writeOutput('Api disconnected');
        const onAdapterState = (e: NotificationEvent['adapter_state_changed']) => {
            setDevices([]);
            writeOutput(`adapter_state_changed: ${e.state}`);
        };
        const onDevices = (e: NotificationEvent['device_updated']) => setDevices(e.devices || []);
        const onDeviceConnectionStatus = ({
            device,
        }: NotificationEvent['device_connection_status']) => {
            setDevices(prev => prev.map(d => (d.id === device.id ? device : d)));
        };

        const onDeviceRead = (e: NotificationEvent['device_read']) => {
            writeOutput(`${e.characteristic} at ${e.id} ${e.data.toString()}`);
        };

        api.on('disconnected', onDisconnected);
        api.on('adapter_state_changed', onAdapterState);
        api.on('device_discovered', onDevices);
        api.on('device_updated', onDevices);
        api.on('device_connected', onDevices);
        api.on('device_disconnected', onDevices);
        api.on('device_connection_status', onDeviceConnectionStatus);
        api.on('device_read', onDeviceRead);

        (async () => {
            try {
                await api.connect();
                setConnected(true);
                writeOutput('API connected.');
            } catch (e) {
                writeOutput(`API not connected. ${e}`);
            }
        })();

        return () => {
            api.disconnect();
            api.removeListener?.('disconnected', onDisconnected);
            api.removeListener?.('adapter_state_changed', onAdapterState);
            api.removeListener?.('device_discovered', onDevices);
            api.removeListener?.('device_updated', onDevices);
            api.removeListener?.('device_connected', onDevices);
            api.removeListener?.('device_disconnected', onDevices);
            api.removeListener?.('device_connection_status', onDeviceConnectionStatus);
        };
    }, []);

    const api = () => apiRef.current as TrezorBluetooth;

    const startScan = async () => {
        try {
            const res = await api().send('start_scan');
            setDevices(res.devices);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const stopScan = async () => {
        try {
            const r = await api().send('stop_scan');
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const getInfo = async () => {
        try {
            const r = await api().send('get_info');
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const enumerate = async () => {
        try {
            const r = await api().send('enumerate');
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const connectDevice = async (id?: string) => {
        const idToUse = id || deviceId;
        try {
            const r = await api().send('connect_device', { id: idToUse, timeout: 10000 });
            writeOutput(r);
            setDeviceId(idToUse);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const disconnectDevice = async (id?: string) => {
        const idToUse = id || deviceId;
        try {
            const r = await api().send('disconnect_device', { id: idToUse });
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const forgetDevice = async () => {
        try {
            const r = await api().send('forget_device', { id: deviceId });
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const openDevice = async () => {
        try {
            const r = await api().send('open_device', {
                id: deviceId,
                characteristic: selectRef.current?.value || undefined,
            });
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const closeDevice = async () => {
        try {
            const r = await api().send('close_device', {
                id: deviceId,
                characteristic: selectRef.current?.value || undefined,
            });
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const write = async () => {
        try {
            const MSG = [63, 35, 35, 0, 55];
            const data = MSG.concat(new Array(244 - MSG.length).fill(0));
            const r = await api().send('write', { id: deviceId, data });
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const read = async () => {
        try {
            const r = await api().send('read', { id: deviceId });
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const setState = async () => {
        try {
            const value = messageInputRef.current!.value.split(',');
            const state = { devices: value.map(d => ({ id: d, macAddress: d })) };
            const r = await api().send('set_state', state);
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const sendMessage = async () => {
        try {
            const { value } = messageInputRef.current!;
            console.warn('VAL', value);
            const json = JSON.parse(value);
            const resp = await api().sendMessage(json);
            writeOutput(resp);
        } catch (e) {
            writeOutput({ error: e.message });
        }
    };

    return (
        <div style={{ fontFamily: 'sans-serif', padding: 12 }}>
            <h2>Trezor Bluetooth UI</h2>
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                            id="api_connect"
                            onClick={() =>
                                api()
                                    .connect()
                                    .then(() => {
                                        setConnected(true);
                                        writeOutput('API connected');
                                    })
                                    .catch((e: any) => writeOutput({ error: e.message }))
                            }
                        >
                            Connect API `{connected ? '✅' : '❌'}
                        </button>
                        <button
                            id="api_disconnect"
                            onClick={() => {
                                api().disconnect();
                                setConnected(false);
                            }}
                        >
                            Disconnect API
                        </button>
                        <button id="start_scan" onClick={startScan}>
                            Start Scan
                        </button>
                        <button id="stop_scan" onClick={stopScan}>
                            Stop Scan
                        </button>
                        <button id="get_info" onClick={getInfo}>
                            Get Info
                        </button>
                        <button id="enumerate" onClick={enumerate}>
                            Enumerate
                        </button>
                        <button id="set_state" onClick={setState}>
                            Set State
                        </button>

                        <textarea
                            id="send_message_input"
                            ref={messageInputRef}
                            defaultValue={`{"method": "get_info"}`}
                            style={{ width: '100%', height: 80 }}
                        />
                        <div style={{ marginTop: 8 }}>
                            <button id="send_message" onClick={sendMessage}>
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ marginTop: 12, flex: 1 }}>
                    <h3>Devices</h3>
                    {devices.length && (
                        <div style={{ marginBottom: 8 }}>
                            <input
                                id="connect_device_input"
                                value={deviceId}
                                onChange={e => setDeviceId(e.target.value)}
                                placeholder="device id to be used by commands below"
                                style={{ width: '60%' }}
                            />
                        </div>
                    )}

                    <div id="device-list">
                        {devices.map(d => (
                            <div
                                key={d.id}
                                id={d.id}
                                className="device-list-item"
                                style={{
                                    border: '1px solid #ddd',
                                    padding: 8,
                                    marginBottom: 6,
                                }}
                            >
                                <div className="device-list-item-details">
                                    <div>name: {d.name}</div>
                                    <div>id: {d.id}</div>
                                    <div>macAddress: {d.macAddress}</div>
                                    <div>
                                        connectionStatus: {JSON.stringify(d.connectionStatus)}
                                    </div>
                                    <div>
                                        Data ({d.data.length}): {d.data.join(',')}
                                    </div>
                                    <div>
                                        Last seen:{' '}
                                        {d.lastUpdatedTimestamp
                                            ? new Date(d.lastUpdatedTimestamp).toLocaleTimeString(
                                                  'en-US',
                                                  { hour12: false },
                                              )
                                            : 'Unknown'}
                                    </div>
                                    <div>
                                        Paired: {String(d.paired)}, Pairable: {d.data[0]}, RSSI:{' '}
                                        {d.rssi}
                                    </div>
                                    <div style={{ marginTop: 6 }}>
                                        <button
                                            style={{ margin: '0 4px' }}
                                            onClick={() => {
                                                setDeviceId(d.id);
                                            }}
                                        >
                                            Use
                                        </button>
                                        <button
                                            style={{ margin: '0 4px' }}
                                            onClick={() =>
                                                d.connectionStatus.type !== 'disconnected'
                                                    ? disconnectDevice(d.id)
                                                    : connectDevice(d.id)
                                            }
                                        >
                                            {d.connectionStatus.type !== 'disconnected'
                                                ? 'Disconnect'
                                                : 'Connect'}
                                        </button>
                                        <button
                                            id="forget_device"
                                            style={{ margin: '0 4px' }}
                                            onClick={forgetDevice}
                                        >
                                            Forget
                                        </button>
                                        <select ref={selectRef}>
                                            <option value="">Select characteristic</option>
                                            <option value="read">READ</option>
                                            <option value="trezor-push-notification">
                                                TREZOR_PUSH_NOTIFICATION
                                            </option>
                                            <option value="battery-level">BATTERY_LEVEL</option>
                                        </select>
                                        <button
                                            id="open_device"
                                            style={{ margin: '0 4px' }}
                                            onClick={openDevice}
                                        >
                                            Open
                                        </button>
                                        <button
                                            id="close_device"
                                            style={{ margin: '0 4px' }}
                                            onClick={closeDevice}
                                        >
                                            Close
                                        </button>
                                        <button
                                            id="write"
                                            style={{ margin: '0 4px' }}
                                            onClick={write}
                                        >
                                            Write
                                        </button>
                                        <button
                                            id="read"
                                            style={{ margin: '0 4px' }}
                                            onClick={read}
                                        >
                                            Read
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ width: 360, flex: 1 }}>
                    <h3>Output</h3>
                    <div
                        id="output"
                        style={{
                            maxHeight: '60vh',
                            overflow: 'auto',
                            background: '#fafafa',
                            padding: 8,
                        }}
                    >
                        {output.map((o, i) => (
                            <p key={i} style={{ margin: 0 }}>
                                {o}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
