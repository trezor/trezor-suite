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
        pre.innerHTML = json;
    } catch {
        pre.innerHTML = `${message}`;
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
    label.innerHTML = d.name + ' ' + d.id;
    details.appendChild(label);

    let p = document.createElement('p');
    p.innerHTML = `${d.macAddress}`;
    details.appendChild(p);

    p = document.createElement('p');
    p.innerHTML = `connectionStatus: ${JSON.stringify(d.connectionStatus)}`;
    details.appendChild(p);

    p = document.createElement('p');
    p.innerHTML = `Data (${d.data.length}): ${d.data}`;
    details.appendChild(p);

    p = document.createElement('p');
    const timestamp = d.lastUpdatedTimestamp
        ? new Date(d.lastUpdatedTimestamp * 1000).toLocaleTimeString('en-US', { hour12: false })
        : 'Unknown';
    p.innerHTML = `Last seen: ${timestamp}`;
    details.appendChild(p);

    p = document.createElement('p');
    p.innerHTML = `Paired: ${d.paired}, Pairable: ${d.data[0]}, RSSI: ${d.rssi}`;
    details.appendChild(p);

    const button = document.createElement('button');
    if (!d.paired && d.data.length === 0) {
        button.setAttribute('disabled', 'disabled');
    }
    button.innerHTML = d.connected ? 'Disconnect' : 'Connect';
    button.onclick = () => {
        if (!d.connected) {
            api.send('connect_device', d.id).then(r => {
                writeOutput(r);
                (document.getElementById('connect_device_input') as HTMLInputElement).value = d.id;
            });
        } else {
            api.send('disconnect_device', d.id).catch(e => {
                writeOutput({ error: e.message });
            });
        }
    };
    item.appendChild(button);

    return item;
};

const updateDeviceList = (api: TrezorBluetooth, devices: BluetoothDevice[]) => {
    const container = getElement('device-list');
    container.innerHTML = '';

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
    const api = new TrezorBluetooth({});

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
        writeOutput(`adapter_state_changed connected: ${event.powered}`);
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
        api.send('connect_device', id)
            .then(r => {
                console.warn('Connect device Result!', r);
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
        api.send('write', [id, [63, 35, 35, 0, 55]])
            .then(r => {
                writeOutput(r);
                // setTimeout(() => {
                //     api.read(value).then(r2 => {
                //         writeToScreen(r2);
                //     })
                // }, 1000);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('erase').onclick = () => {
        const id = getDeviceId();
        api.send('write', [id, [63, 35, 35, 0, 27]])
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
