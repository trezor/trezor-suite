import { analytics, EventType } from '@trezor/suite-analytics';
import { createDeferred } from '@trezor/utils';
import { notificationsActions } from '@suite-common/toast-notifications';

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
} from 'src/types/suite/metadata';
import * as modalActions from 'src/actions/suite/modalActions';
import DropboxProvider from 'src/services/suite/metadata/DropboxProvider';
import GoogleProvider from 'src/services/suite/metadata/GoogleProvider';
import FileSystemProvider from 'src/services/suite/metadata/FileSystemProvider';
import { InMemoryTestProvider } from '../../services/suite/metadata/InMemoryTestProvider';

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

// needs to be declared here in top level context because it's not recommended to keep classes instances in redux state (serialization)
export const providerInstance: Record<DataType, ProviderInstance | undefined> = {
    labels: undefined,
    passwords: undefined,
};

export const fetchIntervals: { [deviceState: string]: any } = {}; // any because of native at the moment, otherwise number | undefined

const createProviderInstance = (
    type: MetadataProvider['type'],
    tokens: Tokens = {},
    environment: OAuthServerEnvironment = 'production',
    clientId?: string,
) => {
    // eslint-disable-next-line default-case
    switch (type) {
        case 'dropbox':
            return new DropboxProvider({
                token: tokens?.refreshToken,
                clientId: clientId || METADATA_PROVIDER.DROPBOX_CLIENT_ID,
            });
        case 'google':
            return new GoogleProvider(tokens, environment);
        case 'fileSystem':
            return new FileSystemProvider();
        case 'inMemoryTest':
            return new InMemoryTestProvider();
    }
};

/**
 * Return already existing instance of AbstractProvider or recreate it from token;
 */
export const getProviderInstance =
    ({ clientId, dataType = 'labels' }: { clientId: string; dataType: DataType }) =>
    (_dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const { providers } = state.metadata;

        const provider = providers.find(p => p.clientId === clientId);

        if (!provider) return;

        // instance already exists but user did not finish log in and decided to use another provider;
        if (providerInstance[dataType] && providerInstance[dataType]?.type !== provider.type) {
            providerInstance[dataType] = undefined;
        }

        if (providerInstance[dataType]) return providerInstance[dataType];

        providerInstance[dataType] = createProviderInstance(
            provider.type,
            provider.tokens,
            state.suite.settings.debug.oauthServerEnvironment,
            clientId,
        );

        return providerInstance[dataType];
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
        Object.values(fetchIntervals).forEach((deviceState, num) => {
            clearInterval(num);
            delete fetchIntervals[deviceState];
        });

        // dispose metadata values (not keys)
        if (removeMetadata) {
            dispatch(metadataActions.disposeMetadata());
        }

        const provider = dispatch(getProviderInstance({ clientId, dataType }));

        if (provider) {
            await provider.disconnect();
            providerInstance[dataType] = undefined;
        }
        // flush reducer
        dispatch({
            type: METADATA.REMOVE_PROVIDER,
            payload: provider,
        });
        dispatch({
            type: METADATA.SET_SELECTED_PROVIDER,
            payload: { dataType, clientId: undefined },
        });

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
        clientId?: string;
    }) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const providerInstance = createProviderInstance(
            type,
            {},
            getState().suite.settings.debug.oauthServerEnvironment,
            clientId,
        );

        const isConnected = await providerInstance.isConnected();
        if (!isConnected) {
            const connectionResult = await providerInstance.connect();
            if ('error' in connectionResult) {
                return connectionResult.error;
            }
        }

        const providerDetails = await providerInstance.getProviderDetails();
        if (!providerDetails.success) {
            dispatch(
                handleProviderError({
                    error: providerDetails,
                    action: ProviderErrorAction.CONNECT,
                    clientId: providerInstance.clientId,
                }),
            );
            return;
        }

        dispatch({
            type: METADATA.ADD_PROVIDER,
            payload: {
                ...providerDetails.payload,
                data: {},
            },
        });

        analytics.report({
            type: EventType.SettingsGeneralLabelingProvider,
            payload: {
                provider: providerDetails.payload.type,
            },
        });

        dispatch(selectProvider({ dataType, clientId: providerInstance.clientId }));

        return true;
    };
