import { type ReactNode, useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import {
    type MetadataRootState,
    metadataLabelingActions,
    selectIsLabelingAvailableForEntity,
    selectIsMetadataEnabled,
    selectMetadata,
} from '@suite/metadata';
import {
    type DesktopSuiteSyncRootState,
    SuiteSyncInteractionsTooltip,
    TurnOnSuiteSyncModals,
    selectDesktopSuiteSyncInteraction,
    suiteSyncErrorHandler,
} from '@suite/suite-sync';
import { useServices } from '@suite-common/dependency-injection';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { type MetadataAddPayload } from '@suite-common/metadata-types';
import { useDispatch } from '@suite-common/redux-utils';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { selectEnsureWalletSuiteSyncOnDep } from '@suite-common/suite-sync-types';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type StaticSessionId } from '@trezor/connect';
import { EditableText, type EditableTextProps } from '@trezor/product-components';
import { type Without } from '@trezor/type-utils';

import { processLegacyMetadataIntoSuiteSyncThunk } from './processLegacyMetadataIntoSuiteSyncThunk';
import { selectIsLabelActionEnabled } from './selectIsLabelActionEnabled';

export type LabelingProps = {
    payload: Without<MetadataAddPayload, 'value'>; // dropping value, as a process of decoupling from legacy labeling
    deviceStaticSessionId: StaticSessionId;
    children?: ReactNode;
    isDisabled?: boolean;
    onSubmit?: (value: string) => Promise<boolean>;
} & Partial<EditableTextProps>;

type LabelingState = MetadataRootState & DesktopSuiteSyncRootState & MessageSystemRootState;

export const Labeling = ({
    payload,
    deviceStaticSessionId,
    children,
    isDisabled,
    onSubmit,
    ...rest
}: LabelingProps) => {
    const dispatch = useDispatch();
    const { ensureWalletSuiteSyncOn } = useServices(selectEnsureWalletSuiteSyncOnDep);
    const [showEnableSuiteSyncModal, setShowEnableSuiteSyncModal] = useState(false);
    const suiteSyncTurnOnEditResolveRef = useRef<((value: boolean) => void) | null>(null);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const legacyMetadataState = useSelector(selectMetadata);
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const isMetadataEnabled = useSelector(selectIsMetadataEnabled);
    const isLabelActionEnabled = useSelector((state: LabelingState) =>
        selectIsLabelActionEnabled(state, deviceStaticSessionId, payload.entityKey),
    );

    const deviceState =
        payload.type === 'walletLabel' ? (payload.entityKey as StaticSessionId) : undefined;
    const isLegacyLabelingEnabled = useSelector((state: LabelingState) =>
        selectIsLabelingAvailableForEntity(state, payload.entityKey, deviceState),
    );

    const suiteSyncInteraction = useSelector((state: LabelingState) =>
        selectDesktopSuiteSyncInteraction(state, deviceStaticSessionId, isMetadataEnabled),
    );

    const handleEdit = useCallback(async () => {
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
            if (suiteSyncInteraction !== null && suiteSyncInteraction !== 'unsupported') {
                // Keys needed is not handled by the same modal, because it in DeviceInteraction context
                if (suiteSyncInteraction === 'keys-needed') {
                    const result = await ensureWalletSuiteSyncOn({
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
                    setShowEnableSuiteSyncModal(true);

                    return new Promise<boolean>(resolve => {
                        suiteSyncTurnOnEditResolveRef.current = resolve;
                    });
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
        deviceState,
        deviceStaticSessionId,
        dispatch,
        isLegacyLabelingEnabled,
        isSuiteSyncEnabled,
        legacyMetadataState.initiating,
        ensureWalletSuiteSyncOn,
        suiteSyncInteraction,
    ]);

    const handleSuiteSyncTurnOnModalComplete = useCallback((success: boolean) => {
        setShowEnableSuiteSyncModal(false);
        setTimeout(() => {
            suiteSyncTurnOnEditResolveRef.current?.(success);
            suiteSyncTurnOnEditResolveRef.current = null;
        }, 100);
    }, []);

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
        [deviceStaticSessionId, dispatch, isSuiteSyncEnabled, payload],
    );

    return (
        <>
            {showEnableSuiteSyncModal && (
                <TurnOnSuiteSyncModals
                    onClose={() => handleSuiteSyncTurnOnModalComplete(false)}
                    onSuccess={() => handleSuiteSyncTurnOnModalComplete(true)}
                    deviceStaticSessionId={deviceStaticSessionId}
                />
            )}
            <SuiteSyncInteractionsTooltip
                suiteSyncInteraction={isSuiteSyncEnabled ? suiteSyncInteraction : null}
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
        </>
    );
};
