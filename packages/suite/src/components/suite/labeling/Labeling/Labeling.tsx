import { type ReactNode, useCallback, useRef, useState } from 'react';

import { isFulfilled } from '@reduxjs/toolkit';

import {
    metadataLabelingActions,
    selectIsLabelingAvailableForEntity,
    selectMetadata,
} from '@suite/metadata';
import { type MetadataAddPayload } from '@suite-common/metadata-types';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { type StaticSessionId } from '@trezor/connect';
import { EditableText, type EditableTextProps } from '@trezor/product-components';

import { selectDesktopSuiteSyncInteraction } from 'src/actions/suiteSync/suiteSyncSlice';
import { processLegacyMetadataIntoSuiteSyncThunk } from 'src/actions/wallet/processLegacyMetadataIntoSuiteSyncThunk';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

import { SuiteSyncInteractionsTooltip } from './SuiteSyncInteractionsTooltip';
import { selectIsLabelActionEnabled } from './selectIsLabelActionEnabled';
import { TurnOnSuiteSyncModals } from '../TurnOnSuiteSync/TurnOnSuiteSyncModals';
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
    const [showEnableSuiteSyncModal, setShowEnableSuiteSyncModal] = useState(false);
    const suiteSyncTurnOnEditResolveRef = useRef<((value: boolean) => void) | null>(null);
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
        isSuiteSyncEnabled,
        suiteSync,
        legacyMetadataState.initiating,
        isLegacyLabelingEnabled,
        suiteSyncInteraction,
        dispatch,
        deviceStaticSessionId,
        deviceState,
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
        [isSuiteSyncEnabled, dispatch, payload, deviceStaticSessionId],
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
                suiteSyncInteraction={!legacyMetadataState.enabled ? suiteSyncInteraction : null}
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
