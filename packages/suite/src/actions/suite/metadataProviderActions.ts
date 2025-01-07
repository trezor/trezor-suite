import { analytics, EventType } from '@trezor/suite-analytics';
import { createDeferred } from '@trezor/utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Device } from '@trezor/connect';
import {
    DropboxProvider,
    GoogleProvider,
    FileSystemProvider,
    InMemoryTestProvider,
} from '@trezor/metadata';
import { desktopApi } from '@trezor/suite-desktop-api';

import { METADATA, METADATA_PROVIDER } from 'src/actions/suite/constants';
import { Dispatch, GetState } from 'src/types/suite';
import {
    MetadataProviderType,
    MetadataProvider,
    Tokens,
    Error as MetadataProviderError,
    OAuthServerEnvironment,
    ProviderErrorAction,
    DataType,
    Metadata,
} from 'src/types/suite/metadata';
import * as modalActions from 'src/actions/suite/modalActions';
import {
    extractCredentialsFromAuthorizationFlow,
    getOauthReceiverUrl,
} from 'src/utils/suite/oauth';

import * as metadataActions from './metadataActions';

export type MetadataAction = {
    type: typeof METADATA.SET_SELECTED_PROVIDER;
    payload: {
        dataType: DataType;
        clientId: string;
    };
};

export type ProviderInstance =
    | DropboxProvider
    | GoogleProvider
    | FileSystemProvider
    | InMemoryTestProvider;

export type FetchIntervalTrackingId =
    `${DataType}-${MetadataProvider['clientId']}-${Required<Device>['state']}`;
export const fetchIntervals: { [id: FetchIntervalTrackingId]: any } = {}; // any because of native at the moment, otherwise number | undefined

const metadataClient = Metadata.getSingleton();

/**
 * Return already existing instance of AbstractProvider or recreate it from token;
 */
export const getProviderInstance =
    ({ clientId, dataType = 'labels' }: { clientId: string; dataType: DataType }) =>
    (_dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const { providers } = state.metadata;

        // const provider = providers.find(p => p.clientId === clientId);

        // if (!provider) return;

        // // instance already exists but user did not finish log in and decided to use another provider;
        // if (providerInstance2[dataType] && providerInstance[dataType]?.type !== provider.type) {
        //     providerInstance[dataType] = undefined;
        // }

        // if (providerInstance[dataType]) return providerInstance[dataType];

        // provider will ask for a url that will be used to send token back from the auth flow
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

        // const providerInstance2 = metadataClient.initProvider(params);

        // return provider;
    };

export const disconnectProvider =
    ({
        clientId,
        dataType,
        removeMetadata = true,
    }: {
        clientId: string;
        dataType: DataType;
        removeMetadata?: boolean;
    }) =>
    async (dispatch: Dispatch) => {
        // dispose metadata values (not keys)
        // if (removeMetadata) {
        //     dispatch(metadataActions.disposeMetadata());
        // }

        metadataClient.disconnectProvider({ dataType, clientId, removeMetadata });

        // providerInstance[dataType] = undefined;
        // dispatch({
        //     type: METADATA.REMOVE_PROVIDER,
        //     payload: provider,
        // });
        // flush reducer
        // dispatch({
        //     type: METADATA.SET_SELECTED_PROVIDER,
        //     payload: { dataType, clientId: undefined },
        // });

        analytics.report({
            type: EventType.SettingsGeneralLabelingProvider,
            payload: {
                provider: '',
            },
        });
    };

/**
 * handleProviderError method controls how application reacts to various errors from metadata providers
 * Toasts go in this format:
 * Error: <Action>: <Reason>
 * Error: Upload failed: Access token is invalid
 */
export const handleProviderError =
    ({
        error,
        action,
        clientId,
    }: {
        error: MetadataProviderError;
        action: string;
        clientId?: string;
    }) =>
    (dispatch: Dispatch) => {
        // error should be of specified type, but in case it is not (catch is not typed) show generic error
        // if this happens, it means that there is a hole in error handling and it should be fixed
        const toastError = error.code
            ? `${action}: ${error?.error}`
            : `Labeling action failed. ${error}`;

        dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: toastError,
            }),
        );

        if (clientId) {
            // handle nicely wrapped errors here
            switch (error.code) {
                // possibly programmer errors
                // something is screwed up, we don't really know what.
                // react by disabling all metadata and toasting error;
                case 'ACCESS_ERROR':
                case 'BAD_INPUT_ERROR':
                case 'OTHER_ERROR':
                    dispatch(metadataActions.disposeMetadata());
                    dispatch(
                        disconnectProvider({
                            clientId,
                            dataType: 'labels',
                        }),
                    );
                    break;
                case 'PROVIDER_ERROR':
                case 'RATE_LIMIT_ERROR':
                case 'AUTH_ERROR':
                    dispatch(
                        disconnectProvider({
                            clientId,
                            dataType: 'labels',
                        }),
                    );
                    break;
                case 'CONNECTIVITY_ERROR':
                default:
                    break;
            }
        }
    };

export const initProvider = () => (dispatch: Dispatch) => {
    const decision = createDeferred<boolean>();
    dispatch(modalActions.openModal({ type: 'metadata-provider', decision }));

    return decision.promise;
};

export const selectProvider =
    ({ dataType, clientId }: { dataType: DataType; clientId: string }) =>
    (dispatch: Dispatch) => {
        dispatch({
            type: METADATA.SET_SELECTED_PROVIDER,
            payload: {
                dataType,
                clientId,
            },
        });
    };

export const connectProvider =
    ({
        type,
        dataType = 'labels',
        clientId,
    }: {
        type: MetadataProviderType;
        dataType?: DataType;
        clientId: string;
    }) =>
    async (dispatch: Dispatch, getState: GetState) => {
        await metadataClient.connectProvider({ dataType, clientId });

        // analytics.report({
        //     type: EventType.SettingsGeneralLabelingProvider,
        //     payload: {
        //         provider: providerDetails.payload.type,
        //     },
        // });

        return true;
    };
