import { TrezorBluetooth } from '../client/trezor-bluetooth';
import { BluetoothDevice } from '../client/types';

const getDeviceId = () =>
    (document.getElementById('connect_device_input') as HTMLInputElement).value;

const getElement = (id: string) => document.getElementById(id) as HTMLElement;

const writeOutput = (message: unknown) => {
    const output = document.getElementById('output') as HTMLElement;
    const pre = document.createElement('p');
    try {
        const json = JSON.stringify(message);
        pre.textContent = json;
    } catch {
        pre.textContent = `${message}`;
    }

    output.appendChild(pre);
};

const createDevice = (api: TrezorBluetooth, d: BluetoothDevice) => {
    const item = document.createElement('div');
    item.setAttribute('id', d.id);
    item.className = 'device-list-item';
    const details = document.createElement('div');
    details.className = 'device-list-item-details';
    item.appendChild(details);

    const label = document.createElement('div');
    label.textContent = d.name + ' ' + d.id;
    details.appendChild(label);

    const useBtn = document.createElement('button');
    useBtn.onclick = () => {
        (document.getElementById('connect_device_input') as HTMLInputElement).value = d.id;
    };
    useBtn.textContent = d.macAddress;
    let p = document.createElement('p');
    p.textContent = `${d.macAddress}`;
    details.appendChild(useBtn);

    p = document.createElement('p');
    p.textContent = `connectionStatus: ${JSON.stringify(d.connectionStatus)}`;
    details.appendChild(p);

    p = document.createElement('p');
    p.textContent = `Data (${d.data.length}): ${d.data}`;
    details.appendChild(p);

    p = document.createElement('p');
    const timestamp = d.lastUpdatedTimestamp
        ? new Date(d.lastUpdatedTimestamp * 1000).toLocaleTimeString('en-US', { hour12: false })
        : 'Unknown';
    p.textContent = `Last seen: ${timestamp}`;
    details.appendChild(p);

    p = document.createElement('p');
    p.textContent = `Paired: ${d.paired}, Pairable: ${d.data[0]}, RSSI: ${d.rssi}`;
    details.appendChild(p);

    const connectBtn = document.createElement('button');
    if (!d.paired && d.data.length === 0) {
        connectBtn.setAttribute('disabled', 'disabled');
    }
    connectBtn.textContent = d.connected ? 'Disconnect' : 'Connect';
    connectBtn.addEventListener('click', () => {
        if (!d.connected) {
            api.send('connect_device', [d.id, 30000])
                .then(r => {
                    writeOutput(r);
                    (document.getElementById('connect_device_input') as HTMLInputElement).value =
                        d.id;
                })
                .catch(e => {
                    writeOutput({ error: e.message });
                });
        } else {
            api.send('disconnect_device', d.id).catch(e => {
                writeOutput({ error: e.message });
            });
        }
    });
    item.appendChild(connectBtn);

    return item;
};

const updateDeviceList = (api: TrezorBluetooth, devices: BluetoothDevice[]) => {
    const container = getElement('device-list');
    container.textContent = '';

    devices.forEach(d => {
        const item = createDevice(api, d);
        container.appendChild(item);
    });
};

const updateDevice = (api: TrezorBluetooth, device: BluetoothDevice) => {
    const toReplace = document.getElementById(device.id);
    const item = createDevice(api, device);
    if (toReplace) {
        toReplace.innerHTML = item.innerHTML;
    }
};

async function init() {
    const api = new TrezorBluetooth({
        url: `ws://localhost:21327/`,
    });

    try {
        await api.connect();
        writeOutput(`API connected.`);
    } catch (e) {
        writeOutput(`API not connected. ${e}`);
    }

    api.on('disconnected', () => {
        writeOutput('Api disconnected');
    });
    api.on('adapter_state_changed', event => {
        updateDeviceList(api, []);
        writeOutput(`adapter_state_changed connected: ${event.state}`);
    });
    api.on('device_discovered', event => {
        updateDeviceList(api, event.devices);
    });
    api.on('device_updated', event => {
        updateDeviceList(api, event.devices);
    });
    api.on('device_connected', event => {
        updateDeviceList(api, event.devices);
    });
    api.on('device_disconnected', event => {
        updateDeviceList(api, event.devices);
    });
    api.on('device_connection_status', event => {
        updateDevice(api, event);
    });

    getElement('api_connect').onclick = () => {
        try {
            api.connect()
                .then(() => {
                    writeOutput('API connected');
                })
                .catch(e => {
                    writeOutput({ error: e.message });
                });
        } catch (e) {
            writeOutput(`API not connected. ${e}`);
        }
    };

    getElement('api_disconnect').onclick = () => {
        api.disconnect();
    };

    getElement('start_scan').onclick = () => {
        api.send('start_scan')
            .then(devices => {
                updateDeviceList(api, devices);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('stop_scan').onclick = () => {
        api.send('stop_scan')
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('get_info').onclick = () => {
        api.send('get_info')
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('enumerate').onclick = () => {
        api.send('enumerate')
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('connect_device').onclick = () => {
        const id = getDeviceId();
        api.send('connect_device', [id, 30000])
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('disconnect_device').onclick = () => {
        const id = getDeviceId();
        api.send('disconnect_device', id)
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('forget_device').onclick = () => {
        const id = getDeviceId();
        api.send('forget_device', id)
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('open_device').onclick = () => {
        const id = getDeviceId();
        api.send('open_device', id)
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('close_device').onclick = () => {
        const id = getDeviceId();
        api.send('close_device', id)
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('write').onclick = () => {
        const id = getDeviceId();
        api.send('write', [id, [63, 35, 35, 0, 55]]) // GetFeatures
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('read').onclick = () => {
        const value = getDeviceId();
        api.send('read', value)
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };
}

window.addEventListener('load', init, false);
