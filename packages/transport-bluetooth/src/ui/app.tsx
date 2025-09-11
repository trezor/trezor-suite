// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useEffect, useRef, useState } from 'react';

import { TrezorBluetooth } from '../client/trezor-bluetooth';
import { BluetoothDevice } from '../client/types';

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
    const [messageInput, setMessageInput] = useState('{}');
    const [connected, setConnected] = useState(false);

    const writeOutput = (message: unknown) => {
        try {
            setOutput(o => [...o, typeof message === 'string' ? message : JSON.stringify(message)]);
        } catch {
            setOutput(o => [...o, `${message}`]);
        }
    };

    useEffect(() => {
        const api = new TrezorBluetooth({ url: `ws://localhost:21327/` });
        apiRef.current = api;

        const onDisconnected = () => writeOutput('Api disconnected');
        const onAdapterState = (e: any) => {
            setDevices([]);
            writeOutput(`adapter_state_changed: ${e.state}`);
        };
        const onDevices = (e: any) => setDevices(e.devices || []);
        const onDeviceConnectionStatus = (e: any) => {
            setDevices(prev => prev.map(d => (d.id === e.id ? e : d)));
        };

        api.on('disconnected', onDisconnected);
        api.on('adapter_state_changed', onAdapterState);
        api.on('device_discovered', onDevices);
        api.on('device_updated', onDevices);
        api.on('device_connected', onDevices);
        api.on('device_disconnected', onDevices);
        api.on('device_connection_status', onDeviceConnectionStatus);

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
            api.removeListener?.('disconnected', onDisconnected as any);
            api.removeListener?.('adapter_state_changed', onAdapterState as any);
            api.removeListener?.('device_discovered', onDevices as any);
            api.removeListener?.('device_updated', onDevices as any);
            api.removeListener?.('device_connected', onDevices as any);
            api.removeListener?.('device_disconnected', onDevices as any);
            api.removeListener?.('device_connection_status', onDeviceConnectionStatus as any);
        };
    }, []);

    const api = () => apiRef.current as TrezorBluetooth;

    const startScan = async () => {
        try {
            const res = await api().send('start_scan');
            setDevices(res);
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
            const r = await api().send('connect_device', { id: idToUse, timeout: 30000 });
            writeOutput(r);
            setDeviceId(idToUse);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const disconnectDevice = async (id?: string) => {
        const idToUse = id || deviceId;
        try {
            const r = await api().send('disconnect_device', idToUse);
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const forgetDevice = async () => {
        try {
            const id = deviceId;
            const r = await api().send('forget_device', id);
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const openDevice = async () => {
        try {
            const r = await api().send('open_device', deviceId);
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const closeDevice = async () => {
        try {
            const r = await api().send('close_device', deviceId);
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const write = async () => {
        try {
            const r = await api().send('write', { id: deviceId, data: [63, 35, 35, 0, 55] });
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const read = async () => {
        try {
            const r = await api().send('read', deviceId);
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const setState = async () => {
        try {
            const value = deviceId.split(',');
            const state = { devices: value.map(d => ({ id: d, macAddress: d })) };
            const r = await api().send('set_state', state);
            writeOutput(r);
        } catch (e: any) {
            writeOutput({ error: e.message });
        }
    };

    const sendMessage = () => {
        try {
            const json = JSON.parse(messageInput);
            const resp = api().sendMessage(json);
            writeOutput(resp);
        } catch (e) {
            writeOutput(e);
        }
    };

    return (
        <div style={{ fontFamily: 'sans-serif', padding: 12 }}>
            <h2>Trezor Bluetooth UI</h2>
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 8 }}>
                        <input
                            id="connect_device_input"
                            value={deviceId}
                            onChange={e => setDeviceId(e.target.value)}
                            placeholder="device id"
                            style={{ width: '60%' }}
                        />
                    </div>

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
                        <button id="connect_device" onClick={() => connectDevice()}>
                            Connect Device
                        </button>
                        <button id="disconnect_device" onClick={() => disconnectDevice()}>
                            Disconnect Device
                        </button>
                        <button id="forget_device" onClick={forgetDevice}>
                            Forget Device
                        </button>
                        <button id="open_device" onClick={openDevice}>
                            Open Device
                        </button>
                        <button id="close_device" onClick={closeDevice}>
                            Close Device
                        </button>
                        <button id="write" onClick={write}>
                            Write
                        </button>
                        <button id="read" onClick={read}>
                            Read
                        </button>
                        <button id="set_state" onClick={setState}>
                            Set State
                        </button>

                        <textarea
                            id="send_message_input"
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
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
                                    <div>
                                        {d.name} {d.id}
                                    </div>
                                    <div>{d.macAddress}</div>
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
                                            onClick={() => {
                                                setDeviceId(d.id);
                                            }}
                                        >
                                            Use
                                        </button>
                                        <button
                                            onClick={() =>
                                                d.connected
                                                    ? disconnectDevice(d.id)
                                                    : connectDevice(d.id)
                                            }
                                            style={{ marginLeft: 8 }}
                                        >
                                            {d.connected ? 'Disconnect' : 'Connect'}
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
