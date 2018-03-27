/* @flow */
'use strict';

import { LOCATION_CHANGE, push } from 'react-router-redux';

import TrezorConnect, { TRANSPORT, DEVICE_EVENT, UI_EVENT, UI, DEVICE } from 'trezor-connect';
import * as TrezorConnectActions from '../actions/TrezorConnectActions';
import * as ModalActions from '../actions/ModalActions';
import { init as initWeb3 } from '../actions/Web3Actions';
import * as WEB3 from '../actions/constants/Web3';
import * as STORAGE from '../actions/constants/LocalStorage';
import * as CONNECT from '../actions/constants/TrezorConnect';



const initSelectedDevice = async (store: any, device: any): void => {

    const { selectedDevice } = store.getState().connect;

    console.log("WHATSUP?", device, selectedDevice)

    // if we are in LandingPage view switch it to Wallet
    if (selectedDevice && selectedDevice.path === device.path && selectedDevice.instance === device.instance) {
        if (selectedDevice.unacquired || selectedDevice.isUsedElsewhere) {
            store.dispatch( push(`/device/${ selectedDevice.path }/acquire`) );
        } else {
            if (device.features.bootloader_mode) {
                store.dispatch( push(`/device/${ selectedDevice.path }/bootloader`) );
            } else {

                if (device.instance) {
                    store.dispatch( push(`/device/${ device.features.device_id }:${ device.instance }`) );
                } else {
                    store.dispatch( push(`/device/${ device.features.device_id }`) );
                }

                // if (!selectedDevice.initialized && selectedDevice.connected) {
                //     const response = await TrezorConnect.getPublicKey({ 
                //         selectedDevice: selectedDevice.path, 
                //         instance: selectedDevice.instance, 
                //         path: "m/1'/0'/0'", 
                //         confirmation: false 
                //     });

                //     if (response && response.success) {
                //         const xpub = response.payload.xpub;
                //         store.dispatch({
                //             type: CONNECT.AUTH_DEVICE,
                //             device: selectedDevice,
                //             xpub
                //         });
                //     } else {
                //         // TODO: error
                //     }

                //     console.log("INIT SELECTED!", device, response)
                // }

                


                //store.dispatch( push(`/device/${ device.features.device_id }/coin/eth/address/0/send`) );
                //store.dispatch( push(`/device/${ device.features.device_id }/coin/eth/address/0`) );
                // store.dispatch( push(`/device/${ device.features.device_id }`) );

                
                
                


                // store.dispatch( TrezorConnectActions.startDiscoveryProcess(device) );

                // get xpub to force
                
            }
        }
    }
}

const TrezorConnectService = (store: any) => (next: any) => (action: any) => {

    if (action.type === DEVICE.DISCONNECT) {
        const previous = store.getState().connect.selectedDevice;
        next(action);
        if (previous && action.device.path === previous.path) {

            if (previous.unacquired) {

            } else if (previous.initialized) {
                // interrupt discovery process
                store.dispatch( TrezorConnectActions.stopDiscoveryProcess(previous) );

                if (!previous.remember) {
                    store.dispatch(ModalActions.askForRemember(previous));
                }
            }
        }

        return;
    }

    if (action.type === DEVICE.ACQUIRED) {
        const { selectedDevice } = store.getState().connect;
        initSelectedDevice(store, selectedDevice);
    }

    if (action.type === DEVICE.CHANGED) {
        const previousSelectedDevice = store.getState().connect.selectedDevice;
        // Pass actions BEFORE
        next(action);

        if (previousSelectedDevice && action.device.path === previousSelectedDevice.path) {
            //console.warn("TODO: Handle device changed, interrupt running async action (like discovery)", action.device);
        }
    } else if (action.type === DEVICE.DISCONNECT || action.type === CONNECT.SELECT_DEVICE) {
        const previousSelectedDevice = store.getState().connect.selectedDevice;
        // Pass actions BEFORE
        next(action);

        

        const { devices, selectedDevice } = store.getState().connect;
        if (!selectedDevice) {
            store.dispatch( push('/') );
        } else if (previousSelectedDevice.path !== selectedDevice.path || previousSelectedDevice.instance !== selectedDevice.instance) {

            // interrupt discovery process
            store.dispatch( TrezorConnectActions.stopDiscoveryProcess(previousSelectedDevice) );

            initSelectedDevice(store, selectedDevice);
        }

    } else if (action.type === TRANSPORT.ERROR) {
        next(action);
        store.dispatch( push('/') );
    } else {
        // Pass all actions through by default
        next(action);
    }

    

    if (action.type === STORAGE.READY) {

        // TODO: check offline devices

        // set listeners 

        TrezorConnect.on(DEVICE_EVENT, (event: DeviceMessage): void => {
            // post event to TrezorConnectReducer
            store.dispatch({
                type: event.type,
                device: event.payload
            });
        });

        const version: Object = TrezorConnect.getVersion();
        if (version.type === 'library') {
            // handle UI events only if TrezorConnect isn't using popup
            TrezorConnect.on(UI_EVENT, (type: string, data: any): void => {
                // post event to reducers
                store.dispatch({
                    type,
                    data
                });
            });
        }

        // init TrezorConnect library

        TrezorConnect.init({
            hostname: 'localhost', // TODO: controll it in Connect
            transport_reconnect: false,
        })
        .then(() => {
            // post action inited
            //store.dispatch({ type: 'WEB3_START' });

            setTimeout(() => {
                store.dispatch( initWeb3() );
            }, 2000)
            
        })
        .catch(error => {
            store.dispatch({
                type: CONNECT.INITIALIZATION_ERROR,
                error
            })
        });

    } else if (action.type === WEB3.READY) {

        const handleDeviceConnect = (device) => {
            initSelectedDevice(store, device);
        }

        const handleDeviceDisconnect = (device) => {
            // remove addresses and discovery from state
            store.dispatch( TrezorConnectActions.remove(device) );
        }

        TrezorConnect.on(DEVICE.CONNECT, handleDeviceConnect);
        TrezorConnect.on(DEVICE.CONNECT_UNACQUIRED, handleDeviceConnect);

        TrezorConnect.on(DEVICE.DISCONNECT, handleDeviceDisconnect);
        TrezorConnect.on(DEVICE.CONNECT_UNACQUIRED, handleDeviceDisconnect);
        
        // solve possible race condition: 
        // device was connected before Web3 initialized so we need to force DEVICE.CONNECT event on them
        const { devices } = store.getState().connect;
        for (let d of devices) {
            handleDeviceConnect(d);
        }
        
    }

};

export default TrezorConnectService;