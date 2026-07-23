import { type Dispatch } from '@reduxjs/toolkit';

import {
    type MetadataAddPayload,
    type Error as MetadataProviderError,
    ProviderErrorAction,
} from '@suite-common/metadata-types';

import * as metadataProviderActions from '../metadataProviderThunks';
import { type MetadataRootState, selectSelectedProviderForLabels } from '../metadataReducer';
import { addAccountMetadata } from './addAccountMetadata';
import { addDeviceMetadata } from './addDeviceMetadata';

export const addMetadata =
    (payload: MetadataAddPayload) =>
    async (dispatch: Dispatch, getState: () => MetadataRootState): Promise<boolean> => {
        const result = await dispatch(
            payload.type === 'walletLabel'
                ? addDeviceMetadata(payload)
                : addAccountMetadata(payload),
        );

        if (!result.success) {
            const provider = selectSelectedProviderForLabels(getState());

            const getErrorFromUnsuccessfulResult = (): MetadataProviderError => {
                // Error from provider.
                if ('code' in result) return result;

                // Unknown error, need to generate a custom one from the provider instance.
                if (provider !== undefined) {
                    const providerInstance = dispatch(
                        metadataProviderActions.getProviderInstance({
                            clientId: provider.clientId,
                            dataType: 'labels',
                        }),
                    );
                    if (providerInstance) {
                        const reason = 'error' in result ? result.error : '';

                        return providerInstance.error('OTHER_ERROR', reason);
                    }
                }

                // No provider, or not possible to get its instance.
                return { ...result, code: 'OTHER_ERROR' };
            };

            dispatch(
                metadataProviderActions.handleProviderError({
                    error: getErrorFromUnsuccessfulResult(),
                    action: ProviderErrorAction.SAVE,
                    clientId: provider?.clientId,
                }),
            );
        }

        return result.success;
    };
