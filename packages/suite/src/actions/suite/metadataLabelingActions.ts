import TrezorConnect, { StaticSessionId } from '@trezor/connect';
import {
    selectSelectedDevice,
    selectDeviceByStaticSessionId,
    selectDevices,
} from '@suite-common/wallet-core';

import { METADATA, METADATA_LABELING, METADATA_PROVIDER } from 'src/actions/suite/constants';
import { Dispatch, GetState } from 'src/types/suite';
import { selectSelectedProviderForLabels } from 'src/reducers/suite/metadataReducer';

import type { MetadataAction } from './metadataActions';
import * as metadataActions from './metadataActions';
import * as metadataProviderActions from './metadataProviderActions';
import { Metadata, MetadataProvider } from '@trezor/metadata';
import { CreateProviderParams } from '@trezor/metadata/src/api';
import {
    extractCredentialsFromAuthorizationFlow,
    getOauthReceiverUrl,
} from 'src/utils/suite/oauth';
import { desktopApi } from '@trezor/suite-desktop-api';

const metadataClient = Metadata.getSingleton();

export const getOrInitProvider =
    (provider: MetadataProvider) => async (dispatch: Dispatch, getState: GetState) => {
        let params: CreateProviderParams =
            provider.type === 'dropbox'
                ? {
                      type: provider.type,
                      clientId: provider.clientId,
                      tokens: provider.tokens || {},
                  }
                : provider.type === 'google'
                  ? {
                        type: provider.type,
                        clientId: provider.clientId,
                        tokens: provider.tokens || {},
                        code: METADATA_PROVIDER.GOOGLE_CODE_FLOW_CLIENT_ID,
                        implicit: METADATA_PROVIDER.GOOGLE_IMPLICIT_FLOW_CLIENT_ID,
                        environment:
                            getState().suite.settings.debug.oauthServerEnvironment || 'production',
                    }
                  : provider.type === 'fileSystem'
                    ? { type: provider.type, clientId: provider.clientId, desktopApi }
                    : { type: provider.type, clientId: provider.clientId };

        console.log('getOrInitProvider', params);
        const onRequestReceiverUrl = async callback => {
            const url = await getOauthReceiverUrl();
            if (!url) {
                console.error('no url found');

                return;
            }

            return callback(url);
        };

        // provider will ask for a code. it is now implementators (suite, suite mobile) responsibility to extract it
        // and pass it back.
        const onRequestCode = async (url, callback) => {
            const res = await extractCredentialsFromAuthorizationFlow(url);

            return callback(res);
        };

        if (params.type === 'dropbox' || params.type === 'google') {
            params.onRequestReceiverUrl = onRequestReceiverUrl;
            params.onRequestCode = onRequestCode;
        }

        metadataClient.initProvider(params);
        return metadataClient.connectProvider(params).finally(() => {
            dispatch({
                type: METADATA.SET_SELECTED_PROVIDER,
                payload: {
                    dataType: 'labels',
                    clientId: provider.clientId,
                },
            });
        });
        // metadataClient.selectProvider({ dataType: 'labels', clientId: provider.clientId });
    };
/**
 * init - prepare everything needed to load + decrypt and upload + decrypt metadata. Note that this method
 * consists of number of steps of which not all have to necessarily happen. For example
 * user may directly navigate to /settings, enable metadata (by invoking init), but his device
 * does not have state yet.
 * In this case, setDeviceMetadataKey method and those that follow
 * are skipped and user will be asked again either after authorization process or when user
 * tries to add new label.
 */
export const init =
    (force: boolean, deviceStateArg?: StaticSessionId) =>
    async (dispatch: Dispatch, getState: GetState) => {
        console.log('metadata actions init==');
        metadataClient.removeAllListeners();

        metadataClient.on('@metadata/set-data', payload => {
            dispatch({
                type: METADATA.SET_DATA,
                payload,
            });
        });

        metadataClient.on('@metadata/add-provider', payload => {
            console.log('on add provider');
            dispatch({
                type: METADATA.ADD_PROVIDER,
                payload,
            });
        });

        metadataClient.on('@metadata/remove-provider', payload => {
            console.log('on remove provider');
            dispatch({
                type: METADATA.REMOVE_PROVIDER,
                payload: {
                    //todo:
                    clientId: payload.provider.clientId,
                },
            });
        });

        metadataClient.on('@metadata/set-key-filename', payload => {
            dispatch({
                type: METADATA.SET_KEY_FILENAME,
                payload,
            });
        });

        metadataClient.on('@metadata/set-selected-provider', payload => {
            dispatch({
                type: METADATA.SET_SELECTED_PROVIDER,
                payload,
            });
        });

        // todo: request-entity-key should get more information to be really agnostic. here I assume that entityKey is staticSessionId
        metadataClient.on('request-parent-secret', async (entity, callback) => {
            if (entity.type !== 'device') return; //ts

            const devices = selectDevices(getState());
            const device = devices.find(d =>
                d.state?.staticSessionId?.startsWith(`${entity.entityKey}@`),
            );
            if (!device?.state?.staticSessionId) {
                console.warn('problem 1');
                return;
            }
            const deviceSecret = getState().metadata.deviceSecrets[device.state?.staticSessionId];

            if (!deviceSecret) {
                console.warn('problem 2');
            }
            callback(deviceSecret);
        });

        let device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (!device?.state?.staticSessionId) {
            console.warn('device hasnt been authorized yet');
            return false;
        }
        console.log('device.state.staticSessionId', device.state.staticSessionId);

        if (!getState().metadata.deviceSecrets[device.state.staticSessionId]) {
            const result = await TrezorConnect.cipherKeyValue({
                device,
                useEmptyPassphrase: device.useEmptyPassphrase,
                ...METADATA_LABELING.ENCRYPTION_VERSION_CONFIGS[1],
            });

            if (result.success) {
                dispatch({
                    type: METADATA.SET_DEVICE_SECRET,
                    payload: {
                        staticSessionId: device.state.staticSessionId,
                        value: result.payload.value,
                    },
                });
            } else {
                dispatch({ type: METADATA.SET_INITIATING, payload: false });
                dispatch({ type: METADATA.SET_EDITING, payload: undefined });
                dispatch({
                    type: METADATA.SET_ERROR_FOR_DEVICE,
                    payload: {
                        deviceState: device.state!.staticSessionId,
                        failed: true,
                    },
                });
            }
        }

        // todo: duplicate
        device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (!device?.state?.staticSessionId) {
            console.warn('device hasnt been authorized yet');
            return false;
        }

        // todo: is this logic needed?
        if (!force && getState().metadata.error?.[device.state.staticSessionId]) {
            return false;
        }
        if (getState().metadata.error?.[device.state.staticSessionId]) {
            // remove error note about failed migration potentially set in a previous run
            dispatch({
                type: METADATA.SET_ERROR_FOR_DEVICE,
                payload: {
                    deviceState: device.state!.staticSessionId,
                    failed: false,
                },
            });
        }

        dispatch({ type: METADATA.SET_INITIATING, payload: true });

        // 1. set metadata enabled globally
        if (!getState().metadata.enabled) {
            dispatch(metadataActions.enableMetadata());
        }

        metadataClient.addEntity({
            type: 'device',
            entityKey: device.state.staticSessionId.split('@')[0],
        });

        device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (!device) return false;

        const provider = selectSelectedProviderForLabels(getState());
        console.log('metadataActions. init provider from redux  ', provider);

        // 4. connect to provider
        if (!provider) {
            const providerResult = await dispatch(metadataProviderActions.initProvider());
            if (!providerResult) {
                dispatch({ type: METADATA.SET_INITIATING, payload: false });
                dispatch({ type: METADATA.SET_EDITING, payload: undefined });

                return false;
            }
        } else {
            // get or init
            await dispatch(getOrInitProvider(provider));
        }

        // now we may allow user to edit labels. everything is ready, local data is synced with provider
        if (getState().metadata.initiating) {
            dispatch({ type: METADATA.SET_INITIATING, payload: false });
        }

        const selectedProvider = selectSelectedProviderForLabels(getState());
        device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (!device?.state?.staticSessionId || !selectedProvider) {
            return true;
        }

        // const fetchIntervalTrackingId = metadataUtils.getFetchTrackingId(
        //     'labels',
        //     selectedProvider.clientId,
        //     device.state.staticSessionId,
        // );

        // 7. if interval for watching provider is not set, create it
        // if (device.state && !metadataProviderActions.fetchIntervals[fetchIntervalTrackingId]) {
        //     // todo: possible race condition that has been around since always
        //     // user is editing label and at that very moment update arrives. updates to specific entities should be probably discarded in such case?
        //     metadataProviderActions.fetchIntervals[fetchIntervalTrackingId] = setInterval(
        //         () => {
        //             const device = selectSelectedDevice(getState());
        //             if (!getState().suite.online || !device?.state?.staticSessionId) {
        //                 return;
        //             }
        //             dispatch(fetchAndSaveMetadata(device.state.staticSessionId));
        //         },
        //         60_000,
        //     );
        // }

        return true;
    };

export const setEditing = (payload: string | undefined): MetadataAction => ({
    type: METADATA.SET_EDITING,
    payload,
});
