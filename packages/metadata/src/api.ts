import { arrayPartition, cloneObject, TypedEmitter, Throttler } from '@trezor/utils';

import { DropboxProvider, GoogleProvider, FileSystemProvider, InMemoryTestProvider } from '../src';

import type { AbstractMetadataProvider } from './services/AbstractProvider';
import type {
    MetadataProvider,
    DataType,
    Tokens,
    OAuthServerEnvironment,
    LabelableEntityKeys,
    MetadataEncryptionVersion,
    Data,
    MetadataAddPayload,
    AccountLabels,
    WalletLabels,
} from './types';
import * as metadataUtils from './utils';

// todo: rename entityKey to entityId to avoid confusion with encryption key

type DeviceEntity = {
    entityKey: string;
    type: 'device';
    1?: LabelableEntityKeys & {
        key: string;
    };
    2?: LabelableEntityKeys & {
        key: string;
    };
};

type AccountEntity = {
    entityKey: string;
    parentKey: string; // device entity.key
    type: 'account';
    1?: LabelableEntityKeys | undefined;
    2?: LabelableEntityKeys | undefined;
};

type LabelableEntity = DeviceEntity | AccountEntity;

// const ENABLE = '@metadata/enable';
// const DISABLE = '@metadata/disable';
// const SET_DEVICE_METADATA = '@metadata/set-device-metadata';
// const SET_DEVICE_METADATA_PASSWORDS = '@metadata/set-device-metadata-passwords';
const ADD_PROVIDER = '@metadata/add-provider';
const REMOVE_PROVIDER = '@metadata/remove-provider';
// const ACCOUNT_ADD = '@metadata/account-add';
// const SET_INITIATING = '@metadata/set-initiating';
const SET_DATA = '@metadata/set-data';
const SET_SELECTED_PROVIDER = '@metadata/set-selected-provider';
// const SET_ERROR_FOR_DEVICE = '@metadata/set-error-for-device';

const SET_KEY_FILENAME = '@metadata/set-key-filename';

// todo:
const ENCRYPTION_VERSION = 1;

// todo: these should be passed as schemas from implementator. this layer should be data agnostic
export const DEFAULT_ACCOUNT_METADATA: AccountLabels = {
    accountLabel: '',
    outputLabels: {},
    addressLabels: {},
};

export const DEFAULT_WALLET_METADATA: WalletLabels = {
    walletLabel: '',
};

// todo: duplicate
export const FORMAT_VERSION = '1.0.0';

type Events = {
    [ADD_PROVIDER]: Omit<MetadataProvider, 'data'>;
    [REMOVE_PROVIDER]: { provider: { clientId: string } };
    [SET_SELECTED_PROVIDER]: { dataType: DataType; clientId: string };
    [SET_DATA]: { data: Data; provider: { clientId: string } };
    [SET_KEY_FILENAME]: { key: string; fileName: string };

    'request-parent-secret': (
        entity: LabelableEntity,
        callback: (cipheredKeyValue: string) => void,
    ) => void;
};

type ClientId = string;
type OnRequestReceiverUrl = () => void;
type OnRequestCode = () => void;

type TokensOrCallbacks =
    | {
          tokens: Tokens;
          onRequestReceiverUrl?: undefined;
          onRequestCode?: undefined;
      }
    | {
          tokens?: undefined;
          onRequestReceiverUrl: OnRequestReceiverUrl;
          onRequestCode: OnRequestCode;
      };

export type CreateProviderParams = { clientId: string } & (
    | ({
          type: 'dropbox';
      } & TokensOrCallbacks)
    | ({
          type: 'google';
          environment: OAuthServerEnvironment;
          code: string;
          implicit: string;
      } & TokensOrCallbacks)
    | {
          type: 'fileSystem';
          //   todo:
          desktopApi: any;
      }
    | {
          type: 'inMemoryTest';
      }
);

export class Metadata extends TypedEmitter<Events> {
    /**
     * available storage providers. each provider holds actual metadata
     */
    private providers: Record<ClientId, AbstractMetadataProvider> = {};

    /**
     * selected provider for each dataType (feature)
     */
    private selectedProvider: { labels: ClientId; passwords: ClientId } = {
        labels: '',
        passwords: '',
    };

    /** registered labelable entities. */
    private labelableEntitites: LabelableEntity[] = [];

    /**
     *
     */
    data: Data = {};

    private throttler = new Throttler(1000);

    constructor() {
        super();
    }

    static singleton = new Metadata();

    static getSingleton() {
        return Metadata.singleton;
    }

    get isInSync() {
        return this.labelableEntitites.every(
            entity => entity[ENCRYPTION_VERSION] && this.data[entity[ENCRYPTION_VERSION].fileName],
        );
    }

    public selectProvider({ dataType, clientId }: { dataType: DataType; clientId: string }) {
        this.selectedProvider[dataType] = clientId;
        this.emit(SET_SELECTED_PROVIDER, { dataType, clientId });
    }

    public initProvider(params: CreateProviderParams) {
        console.log('api initProvider', params);
        const provider = (() => {
            switch (params.type) {
                case 'dropbox':
                    return new DropboxProvider({
                        token: params.tokens?.refreshToken,
                        clientId: params.clientId,
                    });
                case 'google':
                    return new GoogleProvider(params.tokens, params.environment, {
                        code: params.code,
                        implicit: params.implicit,
                    });
                case 'fileSystem':
                    return new FileSystemProvider({ desktopApi: params.desktopApi });
                case 'inMemoryTest':
                    return new InMemoryTestProvider();
            }
        })();

        if ('onRequestReceiverUrl' in params && params.onRequestReceiverUrl) {
            provider.on('request-receiver-url', params.onRequestReceiverUrl);
        }

        if ('onRequestCode' in params && params.onRequestCode) {
            provider.on('request-code', params.onRequestCode);
        }

        if (!this.providers[params.clientId]) {
            this.providers[params.clientId] = provider;
            this.fetchMetadataForEntities(); // new provider added, refetch metadata (maybe we could fetch only for the newly added provider)
        }
    }

    public async connectProvider({
        dataType = 'labels',
        clientId,
    }: {
        dataType?: DataType;
        clientId: string;
    }) {
        const provider = this.providers[clientId];
        console.log('api connect provider', provider, dataType, clientId);
        console.log('this.providers', this.providers);
        if (!provider) {
            return false;
        }

        const isConnected = await provider.isConnected();
        if (!isConnected) {
            const connectionResult = await provider.connect();
            console.log('connectionResult,connectionResult', connectionResult);
            if ('error' in connectionResult) {
                return connectionResult.error;
            }
        }

        const providerDetails = await provider.getProviderDetails();
        if (!providerDetails.success) {
            // dispatch(
            //     handleProviderError({
            //         error: providerDetails,
            //         action: ProviderErrorAction.CONNECT,
            //         clientId: providerInstance.clientId,
            //     }),
            // );

            return;
        }

        this.emit(ADD_PROVIDER, providerDetails.payload);

        this.selectedProvider[dataType] = clientId;
        this.emit(SET_SELECTED_PROVIDER, {
            dataType,
            clientId,
        });
        return true;
    }

    public async disconnectProvider({
        clientId,
        dataType,
        removeMetadata = true,
    }: {
        clientId: string;
        dataType: DataType;
        removeMetadata?: boolean;
    }) {
        const provider = this.providers[clientId];

        if (provider) {
            await provider.disconnect();
            delete this.providers[clientId];
        }

        if (removeMetadata) {
            // todo: this is retarded
            this.emit(REMOVE_PROVIDER, {
                provider: {
                    clientId,
                },
            });
        }

        // flush reducer
        this.emit(SET_SELECTED_PROVIDER, { dataType, clientId: undefined });

        // todo:
        // remove key filename mapping?
        // remove device secrets?
    }

    private getProviderInstance({ clientId, dataType }: { clientId: string; dataType: DataType }) {
        return this.providers[clientId];
    }

    private async fetchMetadataForEntity({
        clientId,
        dataType,
        entity,
        encryptionVersion = 1,
    }: {
        clientId: ClientId;
        dataType: DataType;
        entity: LabelableEntity;
        encryptionVersion?: MetadataEncryptionVersion;
    }) {
        const providerInstance = this.getProviderInstance({
            clientId,
            dataType,
        });

        if (!providerInstance) {
            throw new Error('no provider instance');
        }

        const entityKeys = entity[encryptionVersion];
        if (!entityKeys) {
            throw new Error('trying to fetch entity without metadata keys');
        }

        const { fileName, aesKey } = entityKeys;

        console.log('fetching filename', fileName);

        const response = await providerInstance.getFileContent(fileName);
        console.log('response', response);
        if (!response.success) {
            throw response;
        }

        if (!response.payload) {
            return undefined;
        }

        // we found associated metadata file for given account, decrypt it and return it
        const decryptedData = metadataUtils.decrypt(
            metadataUtils.arrayBufferToBuffer(response.payload),
            aesKey,
        );

        console.log('decryptedData', decryptedData);
        // validation of fetched data structure. in theory, user may save any data in metadata file (although it is very unlikely)
        // so we should make sure that it at least matches AccountLabels types
        if (entity.type === 'account') {
            if (!decryptedData.addressLabels) {
                console.error('fetchMetadata: addressLabels missing in metadata file');
                decryptedData.addressLabels = {};
            }
            if (!decryptedData.outputLabels) {
                console.error('fetchMetadata: outputLabels missing in metadata file');
                decryptedData.outputLabels = {};
            }
        }

        if (!this.data[clientId]) {
            this.data[clientId] = {};
        }

        // TODO: typeguard decryptedData

        this.data[clientId][fileName] = decryptedData;

        this.emit(SET_DATA, {
            data: {
                [fileName]: decryptedData,
            },
            provider: {
                clientId,
            },
        });
        console.log('decrypted filename', decryptedData);
    }

    private addDeviceMetadata(payload: Extract<MetadataAddPayload, { type: 'walletLabel' }>) {
        const provider = this.getProviderInstance({
            clientId: this.selectedProvider['labels'],
            dataType: 'labels',
        });

        if (!provider)
            return Promise.resolve({
                success: false as const,
                error: 'provider missing',
            });

        // todo: not danger overwrite empty?
        const { fileName, aesKey } =
            this.labelableEntitites.find(e => e.entityKey === payload.entityKey)?.[
                ENCRYPTION_VERSION
            ] ?? {};

        if (!fileName || !aesKey) {
            console.log('return 1');
            return 'meow';
        }
        const data = this.data[fileName];

        const nextMetadata = cloneObject(data ?? DEFAULT_WALLET_METADATA) as WalletLabels;

        const walletLabel =
            typeof payload.value === 'string' && payload.value.length > 0
                ? payload.value
                : undefined;

        nextMetadata.walletLabel = walletLabel;

        if (!provider) {
            // provider should always be set here
            return Promise.resolve({ success: false as const, error: 'no provider instance' });
        }

        return this.encryptAndSaveMetadata({
            data: { walletLabel },
            aesKey,
            fileName,
            providerInstance: provider,
        });
    }

    private addAccountMetadata(payload: Exclude<MetadataAddPayload, { type: 'walletLabel' }>) {
        console.log('addAccoountMeetadata payload', payload);
        const provider = this.getProviderInstance({
            clientId: this.selectedProvider['labels'],
            dataType: 'labels',
        });

        console.log('metadataClient.selectProvider done', this);

        if (!provider) {
            console.log('return 2');

            return Promise.resolve({
                success: false as const,
                error: 'provider missing',
            });
        }

        // todo: not danger overwrite empty?
        const { fileName, aesKey } =
            this.labelableEntitites.find(e => e.entityKey === payload.entityKey)?.[
                ENCRYPTION_VERSION
            ] ?? {};

        if (!fileName || !aesKey) {
            console.log('return 1');
            return 'meow';
        }
        const data = this.data[fileName];

        const nextMetadata = cloneObject(data ?? DEFAULT_ACCOUNT_METADATA) as AccountLabels;

        if (payload.type === 'outputLabel') {
            if (typeof payload.value !== 'string' || payload.value.length === 0) {
                if (!nextMetadata.outputLabels[payload.txid]) {
                    // If we try to delete already deleted label it's ok.
                    // No problem happened. ¯\_ (ツ)_/¯
                    console.log('return 3');

                    return Promise.resolve({ success: true as const });
                }

                delete nextMetadata.outputLabels[payload.txid][payload.outputIndex];
                if (Object.keys(nextMetadata.outputLabels[payload.txid]).length === 0) {
                    delete nextMetadata.outputLabels[payload.txid];
                }
            } else {
                if (!nextMetadata.outputLabels[payload.txid]) {
                    nextMetadata.outputLabels[payload.txid] = {};
                }

                nextMetadata.outputLabels[payload.txid][payload.outputIndex] = payload.value;
            }
        }

        if (payload.type === 'addressLabel') {
            if (typeof payload.value !== 'string' || payload.value.length === 0) {
                delete nextMetadata.addressLabels[payload.defaultValue];
            } else {
                nextMetadata.addressLabels[payload.defaultValue] = payload.value;
            }
        }

        if (payload.type === 'accountLabel') {
            if (typeof payload.value !== 'string' || payload.value.length === 0) {
                delete nextMetadata.accountLabel;
            } else {
                nextMetadata.accountLabel = payload.value;
            }
        }

        // we might intentionally skip saving metadata content to persistent storage.
        if (payload.skipSave) {
            console.log('return 4');

            return Promise.resolve({ success: true as const });
        }

        return this.encryptAndSaveMetadata({
            data: {
                accountLabel: nextMetadata.accountLabel,
                outputLabels: nextMetadata.outputLabels,
                addressLabels: nextMetadata.addressLabels,
            },
            aesKey,
            fileName,
            providerInstance: provider,
        });
    }

    private async encryptAndSaveMetadata({
        data,
        aesKey,
        fileName,
        providerInstance,
    }: {
        data: AccountLabels | WalletLabels;
        aesKey: string;
        fileName: string;
        providerInstance: AbstractMetadataProvider;
    }) {
        const oldData = this.data[fileName];
        const nextData = {
            version: FORMAT_VERSION,
            ...data,
        };
        const encrypted = await metadataUtils.encrypt(nextData, aesKey);

        // todo: optimistic local update + handling if stuff goes wrong
        this.emit(SET_DATA, {
            data: {
                [fileName]: nextData,
            },
            provider: {
                clientId: providerInstance.clientId,
            },
        });

        const saveResult = await providerInstance.setFileContent(fileName, encrypted);

        if (!saveResult.success) {
            // revert local update
            this.data[fileName] = oldData;
            this.emit(SET_DATA, {
                data: {
                    [fileName]: oldData,
                },
                provider: {
                    clientId: providerInstance.clientId,
                },
            });
        } else {
            this.data[fileName] = nextData;
        }
    }

    public addMetadata(payload: MetadataAddPayload) {
        payload.type === 'walletLabel'
            ? this.addDeviceMetadata(payload)
            : this.addAccountMetadata(payload);
    }

    public setEntities(entities: LabelableEntity[]) {
        this.labelableEntitites = entities;
        this.handleEntitiesChanged();
    }

    public addEntity(entity: LabelableEntity) {
        this.labelableEntitites.push(entity);
        console.log('registered new, labelable entity', this.labelableEntitites);
        this.handleEntitiesChanged();
    }

    // todo: too much computational work here over arrays. entities data format should change to key indexed object probably
    private handleEntitiesChanged() {
        this.throttler.throttle('syncMetadataKeys', async () => {
            // deduplicate labelable entities
            const uniqueEntities = this.labelableEntitites.reduce(
                (acc, entity) => {
                    if (!acc[entity.entityKey]) {
                        acc[entity.entityKey] = entity;
                    }
                    return acc;
                },
                {} as Record<string, LabelableEntity>,
            );

            console.log('uniqueEntities', Object.values(uniqueEntities));

            console.log('calling syncMetadataKeys');
            const [entitiesWithoutKeys, entitiesWithKeys] = arrayPartition(
                Object.values(uniqueEntities),
                entity => !entity[ENCRYPTION_VERSION],
            );

            console.log('entitiesWithoutKeys', entitiesWithoutKeys);

            const [syncedEntities, failedToSyncEntities] =
                await this.syncMetadataKeys(entitiesWithoutKeys);

            console.log('syncedEntities', syncedEntities);
            // todo: make this field private
            this.labelableEntitites = [
                ...syncedEntities,
                ...failedToSyncEntities,
                ...entitiesWithKeys,
            ];

            console.log('==== updated labelable entities====', this.labelableEntitites);

            this.fetchMetadataForEntities();
        });
    }

    private fetchMetadataForEntities() {
        Object.keys(this.providers).forEach(clientId => {
            this.labelableEntitites
                .filter(e => e[ENCRYPTION_VERSION])
                .forEach(entity => {
                    this.fetchMetadataForEntity({
                        clientId,
                        dataType: 'labels',
                        entity,
                        encryptionVersion: ENCRYPTION_VERSION,
                    });
                });
        });
    }

    public async syncMetadataKeys(entities: LabelableEntity[]) {
        // [master entitites, slave entities]
        const [childEntities, parentEntities] = arrayPartition(
            entities,
            entity => 'parentKey' in entity,
        );

        let failedToSyncEntities: LabelableEntity[] = [];

        for (const entity of parentEntities as DeviceEntity[]) {
            if (entity[ENCRYPTION_VERSION]) {
                continue;
            }

            const parentSecret = await new Promise<string>(resolve => {
                this.emit('request-parent-secret', entity, resolve);
            });

            const metaKey = metadataUtils.deriveMetadataKey(parentSecret, entity.entityKey);
            const fileName = metadataUtils.deriveFilenameForLabeling(metaKey, ENCRYPTION_VERSION);
            const aesKey = metadataUtils.deriveAesKey(metaKey);

            entity[ENCRYPTION_VERSION] = {
                fileName,
                aesKey,
                // todo: sure?
                key: parentSecret,
            };

            this.emit(SET_KEY_FILENAME, { key: entity.entityKey, fileName });
        }

        childEntities.forEach(entity => {
            if (entity[ENCRYPTION_VERSION]) {
                return;
            }
            const deviceMetaKey = this.labelableEntitites.find(
                // todo: agnostic rename
                d => d.entityKey === entity.parentKey,
            )?.[ENCRYPTION_VERSION]?.key;
            //
            // device?.metadata[encryptionVersion]?.key;

            if (!deviceMetaKey) {
                // account keys can't be set without device keys
                // todo: handle error
                return;
            }
            const metaKey = metadataUtils.deriveMetadataKey(deviceMetaKey, entity.entityKey);
            const fileName = metadataUtils.deriveFilenameForLabeling(metaKey, ENCRYPTION_VERSION);

            const aesKey = metadataUtils.deriveAesKey(metaKey);

            entity[ENCRYPTION_VERSION] = {
                fileName,
                aesKey,
            };

            this.emit(SET_KEY_FILENAME, { key: entity.entityKey, fileName });
        });

        return [entities, failedToSyncEntities];
    }
}
