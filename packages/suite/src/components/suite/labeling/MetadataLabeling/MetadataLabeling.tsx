import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isFulfilled } from '@reduxjs/toolkit';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import {
    selectIsSuiteSyncEnabled,
    selectIsTurnOnSuiteSyncInteractionNeeded,
} from '@suite-common/suite-sync';
import { Button, DropdownMenuItemProps, Row } from '@trezor/components';
import { StaticSessionId } from '@trezor/connect';
import { EditableText, EditableTextProps } from '@trezor/product-components';
import { spacingsPx } from '@trezor/theme';
import { TimerId, exhaustive } from '@trezor/type-utils';

import { addMetadata, init, setEditing } from 'src/actions/suite/metadata/metadataLabelingActions';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectIsLabelingAvailableForEntity,
    selectIsLabelingInitPossible,
} from 'src/reducers/suite/metadataReducer';
import { MetadataAddPayload } from 'src/types/suite/metadata';

import { SuiteSyncInteractionsTooltip } from './SuiteSyncInteractionsTooltip';
import { LabelContentProps, LabelingVariant, MetadataProps, PrimitiveProps } from './definitions';
import { withDropdown } from './withDropdown';
import { withEditable } from './withEditable';
import { updateShowEnableSuiteSyncModal } from '../../../../actions/suiteSync/suiteSyncSlice';
import { processLegacyMetadataIntoSuiteSyncThunk } from '../../../../actions/wallet/processLegacyMetadataIntoSuiteSyncThunk';
import { AccountTypeBadge } from '../../AccountTypeBadge';
import { NO_HIGHLIGHT_ATTRIBUTE } from '../../FindBar/consts';

const LabelValue = styled.div`
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
`;

const LabelDefaultValue = styled(LabelValue)`
    display: flex;

    /* do not shrink when the expanded label does not fit the container - shrink only the label value */
    flex-shrink: 0;
    max-width: 0;

    /* transition max-width because it does not work with auto value */
    transition:
        max-width 0.25s,
        opacity 0.25s;
    transition-timing-function: ease-out;
    opacity: 0;

    &::before {
        content: '|';
        font-size: 14px;
        line-height: 14px;
        margin: 0 6px;
        opacity: 0.25;
    }
`;

const Label = styled.div`
    cursor: pointer;
    display: flex;
    overflow: hidden;
    position: relative;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const ActionButton = styled(Button)<{ $isVisible?: boolean }>`
    visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
`;

const LabelContainer = styled.div`
    display: flex;
    white-space: nowrap;
    align-items: center;
    justify-content: flex-start;
    overflow: hidden;
    gap: ${spacingsPx.sm};

    &:hover {
        ${ActionButton} {
            visibility: visible;
            width: auto;
        }

        ${LabelDefaultValue} {
            max-width: 300px;
            opacity: 1;

            /* the right side of the transition process cannot be reliably animated because we animate max-width while the width can vary  */
            transition-timing-function: ease-in;
        }
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const RelativeButton = styled(Button)`
    position: relative;
    overflow: hidden;
    text-align: left;
`;

const RelativeLabel = styled(Label)<{ $isVisible?: boolean }>`
    position: relative;
    text-align: left;
`;

const Inline = styled.span`
    display: inline-flex;
`;

const ButtonLikeLabel = ({
    editActive,
    payload,
    defaultEditableValue,
    defaultVisibleValue,
    onClick,
    onSubmit,
    onBlur,
    'data-testid': dataTest,
}: PrimitiveProps) => {
    const EditableButton = useMemo(() => withEditable(RelativeButton), []);

    if (editActive) {
        return (
            <EditableButton
                // @ts-expect-error todo: hm this needs some clever generic
                intent="neutral"
                priority="secondary"
                iconLeft="tag"
                data-testid={dataTest}
                originalValue={payload.value ?? defaultEditableValue}
                onSubmit={onSubmit}
                onBlur={onBlur}
                size="small"
            />
        );
    }

    if (payload.value) {
        return (
            <Button
                intent="neutral"
                priority="secondary"
                iconLeft="tag"
                data-testid={dataTest}
                size="small"
                onClick={onClick}
            >
                <Inline>
                    <LabelValue>{payload.value} </LabelValue>
                    {/* This is the defaultVisibleValue which shows up after you hover over the label name: */}
                    {defaultVisibleValue && (
                        <LabelDefaultValue>{defaultVisibleValue}</LabelDefaultValue>
                    )}
                </Inline>
            </Button>
        );
    }

    return <>{defaultVisibleValue}</>;
};

const TextLikeLabel = ({
    accountType,
    networkType,
    path,
    editActive,
    defaultVisibleValue,
    defaultEditableValue,
    payload,
    'data-testid': dataTest,
    onSubmit,
    onBlur,
    updateFlag,
}: PrimitiveProps) => {
    const EditableLabel = useMemo(() => withEditable(RelativeLabel), []);

    const isAccountLabel = payload.type === 'accountLabel';

    if (editActive) {
        return (
            <Row gap={12}>
                <EditableLabel
                    data-testid={dataTest}
                    originalValue={payload.value ?? defaultEditableValue}
                    onSubmit={onSubmit}
                    onBlur={onBlur}
                    updateFlag={updateFlag}
                />
                {isAccountLabel && (
                    <AccountTypeBadge
                        accountType={accountType}
                        networkType={networkType}
                        path={path}
                    />
                )}
            </Row>
        );
    }

    if (payload.value) {
        return (
            <Label data-testid={dataTest}>
                <Row gap={12}>
                    <LabelValue>{payload.value}</LabelValue>
                    {isAccountLabel && (
                        <AccountTypeBadge
                            accountType={accountType}
                            networkType={networkType}
                            path={path}
                        />
                    )}
                </Row>
            </Label>
        );
    }

    return <>{defaultVisibleValue}</>;
};

const getLocalizedActions = (type: MetadataAddPayload['type']) => {
    const defaultMessages = {
        add: <Translation id="TR_LABELING_ADD_LABEL" />,
        edit: <Translation id="TR_LABELING_EDIT_LABEL" />,
        edited: <Translation id="TR_LABELING_EDITED_LABEL" />,
        remove: <Translation id="TR_LABELING_REMOVE_LABEL" />,
    };
    switch (type) {
        case 'outputLabel':
            return {
                add: <Translation id="TR_LABELING_ADD_OUTPUT" />,
                edit: <Translation id="TR_LABELING_EDIT_OUTPUT" />,
                edited: <Translation id="TR_LABELING_EDITED_LABEL" />,
                remove: <Translation id="TR_LABELING_REMOVE_OUTPUT" />,
            };
        case 'addressLabel':
            return {
                add: <Translation id="TR_LABELING_ADD_ADDRESS" />,
                edit: <Translation id="TR_LABELING_EDIT_ADDRESS" />,
                edited: <Translation id="TR_LABELING_EDITED_LABEL" />,
                remove: <Translation id="TR_LABELING_REMOVE_ADDRESS" />,
            };
        case 'accountLabel':
            return {
                add: <Translation id="TR_LABELING_ADD_ACCOUNT" />,
                edit: <Translation id="TR_LABELING_EDIT_ACCOUNT" />,
                edited: <Translation id="TR_LABELING_EDITED_LABEL" />,
                remove: <Translation id="TR_LABELING_REMOVE_ACCOUNT" />,
            };
        case 'walletLabel':
            return {
                add: <Translation id="TR_LABELING_ADD_WALLET" />,
                edit: <Translation id="TR_LABELING_EDIT_WALLET" />,
                edited: <Translation id="TR_LABELING_EDITED_LABEL" />,
                remove: <Translation id="TR_LABELING_REMOVE_WALLET" />,
            };
        default:
            return defaultMessages;
    }
};

const LabelContent = ({
    variant,
    editActive,
    onClick,
    onSubmit,
    onBlur,
    accountType,
    'data-testid': dataTestBase,
    payload,
    networkType,
    path,
    defaultEditableValue,
    defaultVisibleValue,
    updateFlag,
    dropdownOptions,
    deviceStaticSessionId,
}: LabelContentProps) => {
    const ButtonLikeLabelWithDropdown = useMemo(() => {
        if (payload.value && !editActive) {
            return withDropdown(ButtonLikeLabel);
        }

        return ButtonLikeLabel;
    }, [payload.value, editActive]);

    if (variant === 'button' && dropdownOptions) {
        return (
            <ButtonLikeLabelWithDropdown
                editActive={editActive}
                onSubmit={onSubmit}
                onBlur={onBlur}
                data-testid={dataTestBase}
                payload={payload}
                defaultEditableValue={defaultEditableValue}
                defaultVisibleValue={defaultVisibleValue}
                dropdownOptions={dropdownOptions}
                deviceStaticSessionId={deviceStaticSessionId}
            />
        );
    } else if (variant === 'button') {
        return (
            <ButtonLikeLabel
                onClick={onClick}
                editActive={editActive}
                onSubmit={onSubmit}
                onBlur={onBlur}
                data-testid={dataTestBase}
                payload={payload}
                defaultEditableValue={defaultEditableValue}
                defaultVisibleValue={defaultVisibleValue}
                deviceStaticSessionId={deviceStaticSessionId}
            />
        );
    } else {
        return (
            <TextLikeLabel
                editActive={editActive}
                accountType={accountType}
                onSubmit={onSubmit}
                onBlur={onBlur}
                data-testid={dataTestBase}
                payload={payload}
                networkType={networkType}
                path={path}
                defaultEditableValue={defaultEditableValue}
                defaultVisibleValue={defaultVisibleValue}
                updateFlag={updateFlag}
                deviceStaticSessionId={deviceStaticSessionId}
            />
        );
    }
};

const showEditOption = (variant: LabelingVariant) => variant === 'text';

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
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const legacyMetadataState = useSelector(state => state.metadata);
    const isLegacyLabelingInitPossible = useSelector(selectIsLabelingInitPossible);

    const deviceState =
        payload.type === 'walletLabel' ? (payload.entityKey as StaticSessionId) : undefined;
    const isLegacyLabelingEnabled = useSelector(state =>
        selectIsLabelingAvailableForEntity(state, payload.entityKey, deviceState),
    );

    const suiteSyncInteraction = useSelector(state =>
        selectIsTurnOnSuiteSyncInteractionNeeded(state, deviceStaticSessionId),
    );

    const handleEdit = useCallback(async () => {
        // When clicking on inline input edit, ensure that everything needed is already ready.
        if (
            !isSuiteSyncEnabled &&
            // Isn't initiation in progress?
            !legacyMetadataState.initiating &&
            // Is there something that needs to be initiated?
            !isLegacyLabelingEnabled
        ) {
            if (suiteSyncInteraction !== null) {
                dispatch(updateShowEnableSuiteSyncModal({ deviceStaticSessionId }));

                // user can decide if they want to enable metadata or not, so we do not set editing state yet
                return;
            } else {
                return await dispatch(
                    init(
                        // Provide force=true argument (user wants to enable metadata).
                        true,
                        // If this is wallet(device) label, provide unique identifier entityKey which equals to device.state.
                        deviceState,
                    ),
                );
            }
        }
    }, [
        isSuiteSyncEnabled,
        legacyMetadataState.initiating,
        isLegacyLabelingEnabled,
        suiteSyncInteraction,
        dispatch,
        deviceStaticSessionId,
        deviceState,
    ]);

    const handleSubmit = async (value: string | undefined) => {
        if (isSuiteSyncEnabled) {
            const result = await dispatch(
                processLegacyMetadataIntoSuiteSyncThunk({ payload, deviceStaticSessionId, value }),
            );

            if (isFulfilled(result) && !result.payload.success) {
                const { type } = result.payload.error;
                switch (type) {
                    case 'SuiteSyncUnavailableOnDeviceError':
                    case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                    case 'DeviceError':
                    case 'DeviceCancelled':
                    case 'SuiteSyncUpdateError':
                        console.error(result.payload.error);

                        return false;

                    default:
                        return exhaustive(type);
                }
            }

            return true;
        } else {
            return await dispatch(addMetadata({ ...payload, value: value || undefined }));
        }
    };

    const isSuiteSyncPossible =
        suiteSyncInteraction !== 'unsupported' &&
        suiteSyncInteraction !== 'firmware-upgrade-needed';

    return (
        <SuiteSyncInteractionsTooltip suiteSyncInteraction={suiteSyncInteraction}>
            <EditableText
                onSubmit={onSubmit ?? handleSubmit}
                onEdit={handleEdit}
                isDisabled={
                    isDisabled ||
                    (!isLegacyLabelingEnabled &&
                        !isLegacyLabelingInitPossible &&
                        !isSuiteSyncPossible)
                }
                isLoading={legacyMetadataState.initiating || isDiscoveryRunning}
                data-testid={`@metadata/${payload.type}/${payload.defaultValue}/hover-container`}
                {...rest}
            >
                {children}
            </EditableText>
        </SuiteSyncInteractionsTooltip>
    );
};

/**
 * @deprecated Use Labeling instead
 */
export const MetadataLabeling = ({
    payload,
    variant,
    accountType,
    networkType,
    path,
    dropdownOptions,
    defaultEditableValue,
    defaultVisibleValue,
    isDisabled,
    onSubmit,
    visible,
    updateFlag,
    deviceStaticSessionId,
}: MetadataProps) => {
    const dispatch = useDispatch();
    const { isDiscoveryRunning } = useDiscovery();
    const [showSuccess, setShowSuccess] = useState(false);
    const [pending, setPending] = useState(false);

    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const legacyMetadataState = useSelector(state => state.metadata);

    const l10nLabelling = getLocalizedActions(payload.type);
    const dataTestBase = `@metadata/${payload.type}/${payload.defaultValue}`;
    const actionButtonsDisabled = isDiscoveryRunning || pending;
    const isSubscribedToSubmitResult = useRef(payload.defaultValue);

    let timeout: TimerId | undefined;
    useEffect(() => {
        setPending(false);
        setShowSuccess(false);

        return () => {
            isSubscribedToSubmitResult.current = '';
            clearTimeout(timeout!);
        };
    }, [payload.defaultValue, timeout]);

    const isLegacyLabelingInitPossible = useSelector(selectIsLabelingInitPossible);
    const deviceState =
        payload.type === 'walletLabel' ? (payload.entityKey as StaticSessionId) : undefined;
    const isLegacyLabelingEnabled = useSelector(state =>
        selectIsLabelingAvailableForEntity(state, payload.entityKey, deviceState),
    );

    const suiteSyncInteraction = useSelector(state =>
        selectIsTurnOnSuiteSyncInteractionNeeded(state, deviceStaticSessionId),
    );

    // is this concrete instance being edited?
    const editActive = legacyMetadataState.editing === payload.defaultValue;

    const activateEdit = () => {
        // When clicking on inline input edit, ensure that everything needed is already ready.
        if (
            !isSuiteSyncEnabled &&
            // Isn't initiation in progress?
            !legacyMetadataState.initiating &&
            // Is there something that needs to be initiated?
            !isLegacyLabelingEnabled
        ) {
            if (suiteSyncInteraction !== null) {
                dispatch(updateShowEnableSuiteSyncModal({ deviceStaticSessionId }));

                // user can decide if they want to enable metadata or not, so we do not set editing state yet
                return;
            } else {
                dispatch(
                    init(
                        // Provide force=true argument (user wants to enable metadata).
                        true,
                        // If this is wallet(device) label, provide unique identifier entityKey which equals to device.state.
                        deviceState,
                    ),
                );
            }
        }
        dispatch(setEditing(payload.defaultValue));
    };

    const defaultDropdownOptions: DropdownMenuItemProps[] = [
        {
            onClick: () => activateEdit(),
            label: l10nLabelling.edit,
            'data-testid': `edit-label`, // Hack: This will be prefixed in the withDropdown()
        },
    ];

    if (dropdownOptions) {
        dropdownOptions = [...defaultDropdownOptions, ...dropdownOptions];
    }

    const handleBlur = () => {
        if (!legacyMetadataState.initiating) {
            dispatch(setEditing(undefined));
        }
    };

    const defaultOnSubmit = async (value: string | undefined) => {
        isSubscribedToSubmitResult.current = payload.defaultValue;
        setPending(true);

        if (isSuiteSyncEnabled) {
            const result = await dispatch(
                processLegacyMetadataIntoSuiteSyncThunk({ payload, deviceStaticSessionId, value }),
            );
            if (isFulfilled(result) && !result.payload.success) {
                const { type } = result.payload.error;
                switch (type) {
                    case 'SuiteSyncUnavailableOnDeviceError':
                    case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                    case 'DeviceError':
                    case 'DeviceCancelled':
                    case 'SuiteSyncUpdateError':
                        console.error(result.payload.error);
                        setShowSuccess(false);

                        return false;

                    default:
                        return exhaustive(type);
                }
            }

            setShowSuccess(true);
            // Intentional pattern how to use timers with useEffect
            // eslint-disable-next-line react-hooks/immutability
            timeout = setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
            setPending(false);
        } else {
            const result = await dispatch(addMetadata({ ...payload, value: value || undefined }));

            // payload.defaultValue might change during next render, this comparison
            // ensures that success state does not appear if it is no longer relevant.
            if (isSubscribedToSubmitResult.current === payload.defaultValue) {
                setPending(false);
                if (result) {
                    setShowSuccess(true);
                }
                timeout = setTimeout(() => {
                    setShowSuccess(false);
                }, 2000);
            }
        }
    };

    const labelContainerDataTest = `${dataTestBase}/hover-container`;

    const isSuiteSyncPossible =
        suiteSyncInteraction !== 'unsupported' &&
        suiteSyncInteraction !== 'firmware-upgrade-needed';

    // Should "add label"/"edit label" button be visible?
    const showActionButton =
        !isDisabled &&
        (isLegacyLabelingEnabled || isLegacyLabelingInitPossible || isSuiteSyncPossible) &&
        !showSuccess &&
        !editActive;

    const isVisible = pending || visible;

    // Metadata is still initiating, on hover, show only disabled button with spinner.
    if (legacyMetadataState.initiating)
        return (
            <LabelContainer data-testid={labelContainerDataTest}>
                {defaultVisibleValue}
                <ActionButton intent="neutral" isDisabled isLoading size="small">
                    <Translation id="TR_LOADING" />
                </ActionButton>
            </LabelContainer>
        );

    const showEdit = showEditOption(variant);

    return (
        <SuiteSyncInteractionsTooltip suiteSyncInteraction={suiteSyncInteraction}>
            <LabelContainer
                data-testid={labelContainerDataTest}
                onClick={e => payload.value && !editActive && e.stopPropagation()}
                {...{ [NO_HIGHLIGHT_ATTRIBUTE]: editActive || undefined }}
            >
                <LabelContent
                    variant={variant}
                    editActive={editActive}
                    accountType={accountType}
                    onClick={() => activateEdit()}
                    onSubmit={onSubmit || defaultOnSubmit}
                    onBlur={handleBlur}
                    data-testid={dataTestBase}
                    payload={payload}
                    networkType={networkType}
                    path={path}
                    defaultEditableValue={defaultEditableValue}
                    defaultVisibleValue={defaultVisibleValue}
                    updateFlag={updateFlag}
                    dropdownOptions={dropdownOptions}
                    deviceStaticSessionId={deviceStaticSessionId}
                />
                {showActionButton && (showEdit || !payload.value || (payload.value && pending)) && (
                    <ActionButton
                        data-testid={
                            payload.value && showEdit
                                ? `${dataTestBase}/edit-label-button`
                                : `${dataTestBase}/add-label-button`
                        }
                        intent="neutral"
                        priority="secondary"
                        iconLeft={!actionButtonsDisabled ? 'tag' : undefined}
                        isLoading={actionButtonsDisabled}
                        isDisabled={actionButtonsDisabled}
                        $isVisible={isVisible}
                        size="small"
                        onClick={e => {
                            e.stopPropagation();
                            activateEdit();
                        }}
                    >
                        {payload.value && showEdit ? l10nLabelling.edit : l10nLabelling.add}
                    </ActionButton>
                )}

                {showSuccess && !editActive && (
                    <Button
                        intent="brand"
                        priority="secondary"
                        data-testid={`${dataTestBase}/success`}
                        iconLeft="check"
                        size="small"
                    >
                        {l10nLabelling.edited}
                    </Button>
                )}
            </LabelContainer>
        </SuiteSyncInteractionsTooltip>
    );
};
