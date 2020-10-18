import React, { useEffect, useState, useMemo, useRef } from 'react';
import styled from 'styled-components';

import { Button, colors } from '@trezor/components';
import { useActions, useDiscovery, useSelector } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import { MetadataAddPayload } from '@suite-types/metadata';
import { Translation } from '@suite-components';

import { withEditable } from './withEditable';
import { withDropdown } from './withDropdown';

const LabelDefaultValue = styled.div`
    width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.6s;

    &::before {
        content: ': ';
    }
`;

const LabelValue = styled.div`
    display: flex;
`;

const Label = styled.div`
    cursor: pointer;
    display: flex;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 1px;
`;

const LabelButton = styled(Button)`
    justify-content: flex-start;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
`;

const ActionButton = styled(Button)<{ isVisible?: boolean }>`
    transition: visibility 0.3s;
    visibility: ${props => (props.isVisible ? 'visible' : 'hidden')};
    width: auto;
    margin-left: 14px;
`;

const SuccessButton = styled(Button)`
    cursor: wait;
    width: auto;
    margin-left: 14px;
    background-color: ${colors.NEUE_BG_LIGHT_GREEN};
    color: ${colors.NEUE_BG_GREEN};
    &:hover {
        color: ${colors.NEUE_BG_GREEN};
        background-color: ${colors.NEUE_BG_LIGHT_GREEN};
    }
`;

const LabelContainer = styled.div`
    display: flex;
    white-space: nowrap;
    align-items: center;
    overflow: hidden;
    justify-content: flex-start;

    &:hover {
        ${ActionButton} {
            visibility: visible;
            width: auto;
        }

        ${LabelDefaultValue} {
            width: 200px;
        }
    }
`;

interface DropdownMenuItem {
    key: string;
    label: React.ReactNode;
    callback?: () => boolean | void;
    'data-test'?: string;
}

export interface Props {
    defaultVisibleValue?: React.ReactNode;
    payload: MetadataAddPayload;
    dropdownOptions?: DropdownMenuItem[];
}

export interface ExtendedProps extends Props {
    editActive: boolean;
    onSubmit: (value: string | undefined | null) => void;
    onBlur: () => void;
    'data-test': string;
}

const ButtonLikeLabel = (props: ExtendedProps) => {
    const EditableButton = useMemo(() => withEditable(Button), []);

    if (props.editActive) {
        return (
            <EditableButton
                // @ts-ignore todo: hm this needs some clever generic
                variant="tertiary"
                icon="TAG"
                data-test={props['data-test']}
                originalValue={props.payload.value}
                onSubmit={props.onSubmit}
                onBlur={props.onBlur}
            />
        );
    }

    if (props.payload.value) {
        return (
            <LabelButton variant="tertiary" icon="TAG" data-test={props['data-test']}>
                <LabelValue>
                    {props.payload.value}
                    {props.defaultVisibleValue && (
                        <LabelDefaultValue>{props.defaultVisibleValue}</LabelDefaultValue>
                    )}
                </LabelValue>
                {/* This is the defaultVisibleValue which shows up after you hover over the label name */}
            </LabelButton>
        );
    }
    return <>{props.defaultVisibleValue}</>;
};

const TextLikeLabel = (props: ExtendedProps) => {
    const EditableLabel = withEditable(Label);

    if (props.editActive) {
        return (
            <EditableLabel
                data-test={props['data-test']}
                originalValue={props.payload.value}
                onSubmit={props.onSubmit}
                onBlur={props.onBlur}
            />
        );
    }

    if (props.payload.value) {
        return (
            <Label data-test={props['data-test']}>
                <LabelValue>{props.payload.value}</LabelValue>
            </Label>
        );
    }

    return <>{props.defaultVisibleValue}</>;
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

/**
 * User defined labeling component.
 * - This component shows defaultVisibleValue and "Add label" button if no metadata is present.
 * - Otherwise it shows metadata value and provides way to edit it.
 */
const MetadataLabeling = (props: Props) => {
    const metadata = useSelector(state => state.metadata);
    const { isDiscoveryRunning, device } = useDiscovery();
    const [showSuccess, setShowSuccess] = useState(false);
    const [pending, setPending] = useState(false);
    const { addMetadata, init, setEditing } = useActions({
        addMetadata: metadataActions.addMetadata,
        init: metadataActions.init,
        setEditing: metadataActions.setEditing,
    });
    const l10nLabelling = getLocalizedActions(props.payload.type);
    const dataTestBase = `@metadata/${props.payload.type}/${props.payload.defaultValue}`;
    const actionButtonsDisabled = isDiscoveryRunning || pending;
    const isSubscribedToSubmitResult = useRef(props.payload.defaultValue);
    let timeout: number | undefined;

    useEffect(() => {
        setPending(false);
        setShowSuccess(false);
        return () => {
            isSubscribedToSubmitResult.current = '';
            clearTimeout(timeout);
        };
    }, [props.payload.defaultValue, timeout]);

    // is everything ready (more or less) to add label?
    const labelingAvailable = !!(
        metadata.enabled &&
        device?.metadata?.status === 'enabled' &&
        metadata.provider
    );

    // labeling is possible (it is possible to make it available) when we may obtain keys from device. If enabled, we already have them
    // (and only need to connect provider), or if device is connected, we may initiate TrezorConnect.CipherKeyValue call and get them
    const labelingPossible = device?.metadata.status === 'enabled' || device?.connected;

    // is this concrete instance being edited?
    const editActive = metadata.editing === props.payload.defaultValue;

    const activateEdit = () => {
        // when clicking on inline input edit, ensure that everything needed is already ready
        if (
            // isn't initiation in progress?
            !metadata.initiating &&
            // is there something that needs to be initiated?
            !labelingAvailable
        ) {
            // provide force=true argument (user wants to enable metadata)
            init(true);
        }
        setEditing(props.payload.defaultValue);
    };

    let dropdownItems: DropdownMenuItem[] = [
        {
            callback: () => activateEdit(),
            label: l10nLabelling.edit,
            'data-test': '@metadata/edit-button',
            key: 'edit-label',
        },
    ];

    if (props.dropdownOptions) {
        dropdownItems = [...dropdownItems, ...props.dropdownOptions];
    }

    const onSubmit = async (value: string | undefined | null) => {
        isSubscribedToSubmitResult.current = props.payload.defaultValue;
        setPending(true);
        const result = await addMetadata({
            ...props.payload,
            value: value || undefined,
        });
        // props.payload.defaultValue might change during next render, this comparison
        // ensures that success state does not appear if it is no longer relevant
        if (isSubscribedToSubmitResult.current === props.payload.defaultValue) {
            setPending(false);

            if (result) {
                setShowSuccess(true);
            }
            timeout = setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
        }
    };

    const ButtonLikeLabelWithDropdown = useMemo(() => {
        if (props.payload.value) {
            return withDropdown(ButtonLikeLabel);
        }
        return ButtonLikeLabel;
    }, [props.payload.value]);

    // metadata is still initiating, on hover, show only disabled button with spinner
    if (metadata.initiating)
        return (
            <LabelContainer>
                {props.defaultVisibleValue}
                <ActionButton variant="tertiary" isDisabled isLoading>
                    <Translation id="TR_LOADING" />
                </ActionButton>
            </LabelContainer>
        );

    // should "add label"/"edit label" button be visible
    const showActionButton = labelingPossible && !showSuccess && !editActive;

    // should "add label"/"edit label" button for output label be visible
    // special case here. It should not be visible if metadata label already exists (props.payload.value) because
    // this type of labels has dropdown menu instead of "add/edit label button".
    // but we still want to show pending and success status after editing the label.
    const showOutputLabelActionButton =
        showActionButton && (!props.payload.value || (props.payload.value && pending));

    return (
        <LabelContainer>
            {props.payload.type === 'outputLabel' ? (
                <>
                    <ButtonLikeLabelWithDropdown
                        editActive={editActive}
                        onSubmit={onSubmit}
                        onBlur={() => setEditing(undefined)}
                        data-test={dataTestBase}
                        {...props}
                        dropdownOptions={dropdownItems}
                    />

                    {showOutputLabelActionButton && (
                        <ActionButton
                            data-test={`${dataTestBase}/add-label-button`}
                            variant="tertiary"
                            icon={!actionButtonsDisabled ? 'TAG' : undefined}
                            isLoading={actionButtonsDisabled}
                            isDisabled={actionButtonsDisabled}
                            isVisible={pending}
                            onClick={e => {
                                e.stopPropagation();
                                // by clicking on add label button, metadata.editing field is set
                                // to default value of whatever may be labeled (address, etc..)
                                // this way we ensure that only one field may be active at time
                                activateEdit();
                            }}
                        >
                            {l10nLabelling.add}
                        </ActionButton>
                    )}
                </>
            ) : (
                <>
                    <TextLikeLabel
                        editActive={editActive}
                        onSubmit={onSubmit}
                        onBlur={() => setEditing(undefined)}
                        data-test={dataTestBase}
                        {...props}
                    />
                    {showActionButton && (
                        <ActionButton
                            data-test={
                                props.payload.value
                                    ? `${dataTestBase}/edit-label-button`
                                    : `${dataTestBase}/add-label-button`
                            }
                            variant="tertiary"
                            icon={!actionButtonsDisabled ? 'TAG' : undefined}
                            isLoading={actionButtonsDisabled}
                            isDisabled={actionButtonsDisabled}
                            isVisible={pending}
                            onClick={e => {
                                e.stopPropagation();
                                activateEdit();
                            }}
                        >
                            {props.payload.value ? l10nLabelling.edit : l10nLabelling.add}
                        </ActionButton>
                    )}
                </>
            )}

            {showSuccess && !editActive && (
                <SuccessButton
                    variant="tertiary"
                    icon="CHECK"
                    data-test={`${dataTestBase}/success`}
                >
                    {l10nLabelling.edited}
                </SuccessButton>
            )}
        </LabelContainer>
    );
};

export default MetadataLabeling;
