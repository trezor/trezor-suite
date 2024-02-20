import { TrezorBle } from '../client/trezor-ble';
import { BluetoothDevice } from '../client/types';

const getDeviceUuid = () => {
    return (document.getElementById('connect_device_input') as HTMLInputElement).value;
};

const getElement = (id: string) => {
    return document.getElementById(id) as HTMLElement;
};

const writeOutput = (message: unknown) => {
    let output = document.getElementById('output') as HTMLElement;
    let pre = document.createElement('p');
    try {
        const json = JSON.stringify(message);
        pre.innerHTML = json;
    } catch (e) {
        pre.innerHTML = `${message}`;
    }

    output.appendChild(pre);
};

const updateDeviceList = (api: TrezorBle, devices: BluetoothDevice[]) => {
    const container = getElement('device-list');
    container.innerHTML = '';

    devices.forEach(d => {
        let item = document.createElement('div');
        item.className = 'device-list-item';
        let label = document.createElement('pre');
        label.innerHTML = d.name + ' ' + d.address;
        item.appendChild(label);

        let button = document.createElement('button');
        button.innerHTML = d.connected ? 'Disconnect' : 'Connect';
        button.onclick = () => {
            if (!d.connected) {
                api.sendMessage('connect_device', d.address).then(r => {
                    writeOutput(r);
                    (document.getElementById('connect_device_input') as HTMLInputElement).value =
                        d.address;
                });
            } else {
                api.sendMessage('disconnect_device', d.address);
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

    api.on('ApiDisconnected', () => {
        writeOutput('ApiDisconnected');
    });
    api.on('AdapterStateChanged', event => {
        updateDeviceList(api, []);
        writeOutput(`AdapterStateChanged connected: ${event.powered}`);
    });
    api.on('DeviceDiscovered', event => {
        updateDeviceList(api, event.devices);
    });
    api.on('DeviceConnected', event => {
        updateDeviceList(api, event.devices);
    });
    api.on('DeviceDisconnected', event => {
        updateDeviceList(api, event.devices);
    });

    getElement('api_connect').onclick = () => {
        try {
            api.connect().then(() => {
                writeOutput('API connected');
            });
        } catch (e) {
            writeOutput(`API not connected. ${e}`);
        }
    };

    getElement('api_disconnect').onclick = () => {
        api.disconnect();
    };

    getElement('start_scan').onclick = () => {
        console.warn('start');
        api.sendMessage('start_scan').then(r => {
            writeOutput(r);
        });
    };

    getElement('stop_scan').onclick = () => {
        api.sendMessage('stop_scan').then(r => {
            writeOutput(r);
        });
    };

    getElement('get_info').onclick = () => {
        api.sendMessage('get_info').then(r => {
            writeOutput(r);
        });
    };

    getElement('connect_device').onclick = () => {
        const uuid = getDeviceUuid();
        api.sendMessage('connect_device', uuid).then(r => {
            writeOutput(r);
        });
    };

    getElement('disconnect_device').onclick = () => {
        const uuid = getDeviceUuid();
        api.sendMessage('disconnect_device', uuid).then(r => {
            writeOutput(r);
        });
    };

    getElement('open_device').onclick = () => {
        const uuid = getDeviceUuid();
        api.sendMessage('open_device', uuid).then(r => {
            writeOutput(r);
        });
    };

    getElement('close_device').onclick = () => {
        const uuid = getDeviceUuid();
        api.sendMessage('close_device', uuid).then(r => {
            writeOutput(r);
        });
    };

    getElement('write').onclick = () => {
        const uuid = getDeviceUuid();
        api.sendMessage('write', [uuid, [63, 35, 35, 0, 55]]).then(r => {
            writeOutput(r);
            // setTimeout(() => {
            //     api.read(value).then(r2 => {
            //         writeToScreen(r2);
            //     })
            // }, 1000);
        });
    };

    getElement('read').onclick = () => {
        const value = getDeviceUuid();
        api.sendMessage('read', value).then(r => {
            writeOutput(r);
        });
    };
}

window.addEventListener('load', init, false);
