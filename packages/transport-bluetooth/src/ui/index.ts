import { TrezorBle } from '../client/trezor-ble';
import { BluetoothDevice } from '../client/types';

const getDeviceUuid = () => {
    return (document.getElementById('connect_device_input') as HTMLInputElement).value;
};

const getElement = (id: string) => {
    return document.getElementById(id) as HTMLElement;
};

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

const updateDeviceList = (api: TrezorBle, devices: BluetoothDevice[]) => {
    const container = getElement('device-list');
    container.innerHTML = '';

    devices.forEach(d => {
        const item = document.createElement('div');
        item.className = 'device-list-item';
        const details = document.createElement('div');
        details.className = 'device-list-item-details';
        item.appendChild(details);

        const label = document.createElement('div');
        label.innerHTML = d.name + ' ' + d.uuid;
        details.appendChild(label);

        let p = document.createElement('p');
        p.innerHTML = `Data (${d.data.length}): ${d.data}`;
        details.appendChild(p);

        p = document.createElement('p');
        const timestamp = d.timestamp
            ? new Date(d.timestamp * 1000).toLocaleTimeString('en-US', { hour12: false })
            : 'Unknown';
        p.innerHTML = `Last seen: ${timestamp}`;
        details.appendChild(p);

        p = document.createElement('p');
        p.innerHTML = `Paired: ${d.paired}, Pairable: ${d.pairing_mode}, RSSI: ${d.rssi}`;
        details.appendChild(p);

        const button = document.createElement('button');
        if (d.data.length === 0) {
            button.setAttribute('disabled', 'disabled');
        }
        button.innerHTML = d.connected ? 'Disconnect' : 'Connect';
        button.onclick = () => {
            if (!d.connected) {
                api.sendMessage('connect_device', d.uuid).then(r => {
                    writeOutput(r);
                    (document.getElementById('connect_device_input') as HTMLInputElement).value =
                        d.uuid;
                });
            } else {
                api.sendMessage('disconnect_device', d.uuid).catch(e => {
                    writeOutput({ error: e.message });
                });
            }
        };
        item.appendChild(button);

        container.appendChild(item);
    });
};

async function init() {
    const api = new TrezorBle({});

    try {
        await api.connect();
        writeOutput(`API connected.`);
    } catch (e) {
        writeOutput(`API not connected. ${e}`);
    }

    api.on('api_disconnected', () => {
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
        api.sendMessage('start_scan')
            .then(devices => {
                updateDeviceList(api, devices);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('stop_scan').onclick = () => {
        api.sendMessage('stop_scan')
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('get_info').onclick = () => {
        api.sendMessage('get_info')
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('connect_device').onclick = () => {
        const uuid = getDeviceUuid();
        api.sendMessage('connect_device', uuid)
            .then(r => {
                console.warn('Connect device Result!', r);
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('disconnect_device').onclick = () => {
        const uuid = getDeviceUuid();
        api.sendMessage('disconnect_device', uuid)
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('forget_device').onclick = () => {
        const uuid = getDeviceUuid();
        api.sendMessage('forget_device', uuid)
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('open_device').onclick = () => {
        const uuid = getDeviceUuid();
        api.sendMessage('open_device', uuid)
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('close_device').onclick = () => {
        const uuid = getDeviceUuid();
        api.sendMessage('close_device', uuid)
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('write').onclick = () => {
        const uuid = getDeviceUuid();
        api.sendMessage('write', [uuid, [63, 35, 35, 0, 55]])
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
        const uuid = getDeviceUuid();
        api.sendMessage('write', [uuid, [63, 35, 35, 0, 27]])
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };

    getElement('read').onclick = () => {
        const value = getDeviceUuid();
        api.sendMessage('read', value)
            .then(r => {
                writeOutput(r);
            })
            .catch(e => {
                writeOutput({ error: e.message });
            });
    };
}

window.addEventListener('load', init, false);
