import { ReactNode, useCallback } from 'react';

import { isFulfilled } from '@reduxjs/toolkit';

import {
    metadataLabelingActions,
    selectIsLabelingAvailableForEntity,
    selectMetadata,
} from '@suite/metadata';
import { MetadataAddPayload } from '@suite-common/metadata-types';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { StaticSessionId } from '@trezor/connect';
import { EditableText, EditableTextProps } from '@trezor/product-components';

import {
    openEnableSuiteSyncModalAndWaitThunk,
    selectDesktopSuiteSyncInteraction,
} from 'src/actions/suiteSync/suiteSyncSlice';
import { processLegacyMetadataIntoSuiteSyncThunk } from 'src/actions/wallet/processLegacyMetadataIntoSuiteSyncThunk';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

import { SuiteSyncInteractionsTooltip } from './SuiteSyncInteractionsTooltip';
import { selectIsLabelActionEnabled } from './selectIsLabelActionEnabled';
import { suiteSyncErrorHandler } from '../suiteSyncErrorHandler';

type LabelingProps = {
    payload: MetadataAddPayload;
    deviceStaticSessionId: StaticSessionId;
    children?: ReactNode;
    isDisabled?: boolean;
    onSubmit?: (value: string) => Promise<boolean>;
} & Partial<EditableTextProps>;

export const Labeling = ({
    payload,
    deviceStaticSessionId,
    children,
    isDisabled,
    onSubmit,
    ...rest
}: LabelingProps) => {
    const dispatch = useDispatch();
    const { isDiscoveryRunning } = useDiscovery();
    const { suiteSync } = useSuiteServices();
    const legacyMetadataState = useSelector(selectMetadata);
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const isLabelActionEnabled = useSelector(state =>
        selectIsLabelActionEnabled(state, deviceStaticSessionId, payload.entityKey),
    );

    const deviceState =
        payload.type === 'walletLabel' ? (payload.entityKey as StaticSessionId) : undefined;
    const isLegacyLabelingEnabled = useSelector(state =>
        selectIsLabelingAvailableForEntity(state, payload.entityKey, deviceState),
    );

    const suiteSyncInteraction = useSelector(state =>
        selectDesktopSuiteSyncInteraction(state, deviceStaticSessionId),
    );

    const handleEdit = useCallback(async (): Promise<boolean> => {
        if (isSuiteSyncEnabled && suiteSyncInteraction === null) {
            return true;
        }

        // When clicking on inline input edit, ensure that everything needed is already ready.
        if (
            !isSuiteSyncEnabled &&
            // Isn't initiation in progress?
            !legacyMetadataState.initiating &&
            // Is there something that needs to be initiated?
            !isLegacyLabelingEnabled
        ) {
            if (suiteSyncInteraction !== null) {
                // Keys needed is not handled by the same modal, because it in DeviceInteraction context
                if (suiteSyncInteraction === 'keys-needed') {
                    const result = await suiteSync.ensureWalletSuiteSyncOn({
                        deviceStaticSessionId,
                        isWriteMode: false,
                    });

                    if (!result.success) {
                        suiteSyncErrorHandler({
                            error: result.error,
                            dispatch,
                            deviceStaticSessionId,
                        });
                    }

                    return result.success;
                } else {
                    const result = await dispatch(
                        openEnableSuiteSyncModalAndWaitThunk(deviceStaticSessionId),
                    );

                    return isFulfilled(result) ? result.payload : false;
                }
            } else {
                return await dispatch(
                    metadataLabelingActions.init(
                        // Provide force=true argument (user wants to enable metadata).
                        true,
                        // If this is wallet(device) label, provide unique identifier entityKey which equals to device.state.
                        deviceState,
                    ),
                );
            }
        }

        return true;
    }, [
        isSuiteSyncEnabled,
        suiteSync,
        legacyMetadataState.initiating,
        isLegacyLabelingEnabled,
        suiteSyncInteraction,
        dispatch,
        deviceStaticSessionId,
        deviceState,
    ]);

    const handleSubmit = useCallback(
        async (value: string | undefined) => {
            if (isSuiteSyncEnabled) {
                const result = await dispatch(
                    processLegacyMetadataIntoSuiteSyncThunk({
                        payload,
                        deviceStaticSessionId,
                        value,
                    }),
                );

                if (isFulfilled(result) && !result.payload.success) {
                    suiteSyncErrorHandler({
                        error: result.payload.error,
                        dispatch,
                        deviceStaticSessionId,
                    });

                    return false;
                }

                return true;
            } else {
                return await dispatch(
                    metadataLabelingActions.addMetadata({ ...payload, value: value || undefined }),
                );
            }
        },
        [isSuiteSyncEnabled, dispatch, payload, deviceStaticSessionId],
    );

    return (
        <SuiteSyncInteractionsTooltip
            suiteSyncInteraction={suiteSyncInteraction}
            deviceStaticSessionId={deviceStaticSessionId}
        >
            <EditableText
                onSubmit={onSubmit ?? handleSubmit}
                onEdit={handleEdit}
                isDisabled={isDisabled || !isLabelActionEnabled}
                isLoading={legacyMetadataState.initiating || isDiscoveryRunning}
                data-testid={`@metadata/${payload.type}/${payload.defaultValue}/hover-container`}
                {...rest}
            >
                {children}
            </EditableText>
        </SuiteSyncInteractionsTooltip>
    );
};
