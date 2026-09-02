import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { selectOAuthServerEnvironment } from '@suite/settings';
import {
    type DataType,
    type MetadataProvider,
    type Error as MetadataProviderError,
    type MetadataProviderType,
    type OAuthServerEnvironment,
    ProviderErrorAction,
    type Tokens,
} from '@suite-common/metadata-types';
import { type Dispatch, type WithServices } from '@suite-common/redux-utils';
import { triggerWebDownloadFile } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { exhaustive } from '@trezor/type-utils';
import { createDeferred, createZip, typedObjectKeys } from '@trezor/utils';

import * as metadataActions from './metadataActions';
import * as METADATA from './metadataConstants';
import { disposeMetadataThunk } from './metadataDataThunks';
import * as METADATA_PROVIDER from './metadataProviderConstants';
import {
    type MetadataRootState,
    selectMetadata,
    selectSelectedProviderForLabels,
} from './metadataReducer';
import { type FetchIntervalTrackingId } from './metadataUtils';
import { DropboxProvider } from './providers/DropboxProvider';
import { FileSystemProvider } from './providers/FileSystemProvider';
import { GoogleProvider } from './providers/GoogleProvider';
import { InMemoryTestProvider } from './providers/InMemoryTestProvider';

type ProviderInstance =
    DropboxProvider | GoogleProvider | FileSystemProvider | InMemoryTestProvider;

// needs to be declared here in top level context because it's not recommended to keep classes instances in redux state (serialization)
export const providerInstance: Record<DataType, ProviderInstance | undefined> = {
    labels: undefined,
    passwords: undefined,
};

export const fetchIntervals: { [id: FetchIntervalTrackingId]: any } = {}; // any because of native at the moment, otherwise number | undefined

const createProviderInstance = (
    type: MetadataProvider['type'],
    tokens: Tokens = {},
    environment: OAuthServerEnvironment = 'production',
    clientId?: string,
) => {
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

        default:
            return exhaustive(type);
    }
};

type GetProviderInstanceParams = { clientId: string; dataType: DataType };

type GetProviderInstanceThunkState = MetadataRootState;

/**
 * Return already existing instance of AbstractProvider or recreate it from token;
 */
export const getProviderInstanceThunk =
    ({ clientId, dataType = 'labels' }: GetProviderInstanceParams) =>
    (_dispatch: Dispatch, getState: () => GetProviderInstanceThunkState) => {
        const { providers } = selectMetadata(getState());

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
            selectOAuthServerEnvironment(getState()),
            clientId,
        );

        return providerInstance[dataType];
    };

type DisconnectProviderParams = {
    clientId: string;
    dataType: DataType;
    removeMetadata?: boolean;
};

type DisconnectProviderDeps = WithServices<DesktopAnalyticsDep>;

type DisconnectProviderThunkState = MetadataRootState;

type DisconnectProviderThunkDeps = DisconnectProviderDeps;

export const disconnectProviderThunk =
    ({ clientId, dataType, removeMetadata = true }: DisconnectProviderParams) =>
    async (
        dispatch: Dispatch,
        _getState: () => DisconnectProviderThunkState,
        extra: DisconnectProviderThunkDeps,
    ) => {
        typedObjectKeys(fetchIntervals).forEach((id: FetchIntervalTrackingId) => {
            const [trackedDataType, trackedClientId] = id.split('-');
            if (trackedDataType === dataType && trackedClientId === clientId) {
                clearInterval(fetchIntervals[id]);
                delete fetchIntervals[id];
            }
        });

        // dispose metadata values (not keys)
        if (removeMetadata) {
            dispatch(disposeMetadataThunk());
        }

        const provider = dispatch(getProviderInstanceThunk({ clientId, dataType }));

        if (provider !== undefined) {
            await provider.disconnect();
            providerInstance[dataType] = undefined;

            // flush reducer
            dispatch(metadataActions.removeMetadataProvider({ clientId }));
            dispatch({
                type: METADATA.SET_SELECTED_PROVIDER,
                payload: { dataType, clientId: undefined },
            });

            extra.services.analytics.report({
                type: events.settingsGeneralLabelingProviderEvent.name,
                payload: {
                    provider: '',
                },
            });
        }
    };

type HandleProviderErrorParams = {
    error: MetadataProviderError;
    action: string;
    clientId?: string;
};

/**
 * handleProviderError method controls how application reacts to various errors from metadata providers
 * Toasts go in this format:
 * Error: <Action>: <Reason>
 * Error: Upload failed: Access token is invalid
 */
export const handleProviderError =
    ({ error, action, clientId }: HandleProviderErrorParams) =>
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
                    dispatch(disposeMetadataThunk());
                    dispatch(
                        disconnectProviderThunk({
                            clientId,
                            dataType: 'labels',
                        }),
                    );
                    break;

                case 'PROVIDER_ERROR':
                case 'RATE_LIMIT_ERROR':
                case 'AUTH_ERROR':
                    dispatch(
                        disconnectProviderThunk({
                            clientId,
                            dataType: 'labels',
                        }),
                    );
                    break;

                case 'CONNECTIVITY_ERROR':
                case 'NOT_FOUND_ERROR':
                    break;

                // intentionally not exhaustive: although we expect a typed Error, any Error can in fact happen
                default:
                    console.error(error);
            }
        }
    };

export const initProvider = () => (dispatch: Dispatch) => {
    const decision = createDeferred<boolean>();
    dispatch({
        type: '@modal/open-user-context',
        payload: { type: 'metadata-provider', decision },
    });

    return decision.promise;
};

const selectProvider =
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

type ConnectProviderParams = {
    type: MetadataProviderType;
    dataType?: DataType;
    clientId?: string;
};

export type ConnectProviderDeps = WithServices<DesktopAnalyticsDep>;

type ConnectProviderThunkState = MetadataRootState;

type ConnectProviderThunkDeps = ConnectProviderDeps;

export const connectProviderThunk =
    ({ type, dataType = 'labels', clientId }: ConnectProviderParams) =>
    async (
        dispatch: Dispatch,
        getState: () => ConnectProviderThunkState,
        extra: ConnectProviderThunkDeps,
    ) => {
        const providerInstance = createProviderInstance(
            type,
            {},
            selectOAuthServerEnvironment(getState()),
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

        dispatch(
            metadataActions.addMetadataProvider({
                ...providerDetails.payload,
                data: {},
            }),
        );

        extra.services.analytics.report({
            type: events.settingsGeneralLabelingProviderEvent.name,
            payload: {
                provider: providerDetails.payload.type,
            },
        });

        dispatch(selectProvider({ dataType, clientId: providerInstance.clientId }));

        return true;
    };

type ExportMetadataToLocalFileThunkState = MetadataRootState;

export const exportMetadataToLocalFileThunk =
    () => async (dispatch: Dispatch, getState: () => ExportMetadataToLocalFileThunkState) => {
        const provider = selectSelectedProviderForLabels(getState());
        if (!provider) return;
        const providerInstance = dispatch(
            getProviderInstanceThunk({
                clientId: provider.clientId,
                dataType: 'labels',
            }),
        );

        if (!providerInstance) return;

        const filesListResult = await providerInstance.getFilesList();

        if (!filesListResult.success || !filesListResult.payload?.length) {
            dispatch(
                notificationsActions.addToast({ type: 'error', error: 'Exporting labels failed' }),
            );

            return;
        }

        const files = filesListResult.payload;

        return Promise.all(
            files.map(file =>
                providerInstance.getFileContent(file).then(result => {
                    if (!result.success) throw new Error(result.error);

                    return { name: file, content: result.payload };
                }),
            ),
        )
            .then(filesContent => {
                const zipBlob = createZip(filesContent);
                // Trigger download
                triggerWebDownloadFile(zipBlob, 'archive.zip');
            })
            .catch(_err => {
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: 'Exporting labels failed',
                    }),
                );

                return;
            });
    };
