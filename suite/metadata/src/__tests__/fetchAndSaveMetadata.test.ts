import { configureMockStore } from '@suite-common/test-utils';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { createDeferred } from '@trezor/utils';

import { fetchAndSaveMetadata } from '../fetchAndSaveMetadata';
import * as metadataProviderActions from '../metadataProviderThunks';
import { initialMetadataState } from '../metadataReducer';
import * as metadataUtils from '../metadataUtils';
import { InMemoryTestProvider } from '../providers/InMemoryTestProvider';

describe(fetchAndSaveMetadata.name, () => {
    it('coalesces concurrent metadata fetches for the same provider and device', async () => {
        const staticSessionId = 'wallet@device:0' as const;
        const aesKey = '00'.repeat(32);
        const encryptedMetadata = await metadataUtils.encrypt({}, aesKey);
        const state = {
            metadata: {
                ...initialMetadataState,
                enabled: true,
                providers: [
                    {
                        type: 'inMemoryTest' as const,
                        clientId: 'inMemoryTest',
                        data: {},
                        isCloud: false,
                        tokens: {},
                        user: '',
                    },
                ],
                selectedProvider: { labels: 'inMemoryTest', passwords: '' },
            },
            device: {
                devices: [
                    {
                        state: { staticSessionId },
                        metadata: {
                            1: {
                                fileName: 'wallet.mtdt',
                                aesKey,
                                key: 'metadata-key',
                            },
                        },
                    },
                ],
                selectedDevice: {
                    state: { staticSessionId },
                    metadata: {
                        1: {
                            fileName: 'wallet.mtdt',
                            aesKey,
                            key: 'metadata-key',
                        },
                    },
                },
                persistentDeviceData: [],
                isConnectionModalOpen: false,
            },
            suite: {
                online: true,
            },
            suiteSettings: {
                debug: {},
            },
            wallet: {
                accounts: [],
                selectedAccount: {
                    account: undefined,
                },
                settings: initialWalletSettingsState,
            },
        };
        const store = configureMockStore({
            reducer: (currentState = state) => currentState,
            preloadedState: state,
        });
        const providerDetails =
            createDeferred<Awaited<ReturnType<InMemoryTestProvider['getProviderDetails']>>>();
        const getProviderDetailsSpy = jest
            .spyOn(InMemoryTestProvider.prototype, 'getProviderDetails')
            .mockReturnValue(providerDetails.promise);
        const getFileContentSpy = jest
            .spyOn(InMemoryTestProvider.prototype, 'getFileContent')
            .mockResolvedValue({ success: true, payload: encryptedMetadata });

        try {
            metadataProviderActions.providerInstance.labels = undefined;

            const firstFetch = store.dispatch(fetchAndSaveMetadata(staticSessionId));
            const secondFetch = store.dispatch(fetchAndSaveMetadata(staticSessionId));

            expect(getProviderDetailsSpy).toHaveBeenCalledTimes(1);

            providerDetails.resolve({
                success: true,
                payload: {
                    type: 'inMemoryTest',
                    clientId: 'inMemoryTest',
                    isCloud: false,
                    tokens: {},
                    user: '',
                },
            });
            await Promise.all([firstFetch, secondFetch]);

            expect(getFileContentSpy).toHaveBeenCalledTimes(1);
        } finally {
            getProviderDetailsSpy.mockRestore();
            getFileContentSpy.mockRestore();
            metadataProviderActions.providerInstance.labels = undefined;
        }
    });
});
