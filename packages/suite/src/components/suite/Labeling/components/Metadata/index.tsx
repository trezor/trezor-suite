import React from 'react';
import { Button, Dropdown } from '@trezor/components';
import styled from 'styled-components';
import { useActions, useDiscovery, useSelector } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import { MetadataAddPayload, DeviceMetadata } from '@suite-types/metadata';
import { Translation } from '@suite-components';

import MetadataEdit from './Edit';

const LabelDefaultValue = styled.div`
    width: 0;
    text-overflow: ellipsis;

    &::before {
        content: ': ';
    }
`;

const AddLabelButton = styled(Button)`
    visibility: hidden;
    width: 0;
    margin-left: 14px;
`;

const LabelValue = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Label = styled.div`
    cursor: pointer;
    display: flex;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const LabelContainer = styled.div`
    display: flex;
    white-space: nowrap;
    align-items: center;
    overflow: hidden;

    &:hover {
        ${AddLabelButton} {
            visibility: visible;
            width: auto;
        }
        ${LabelDefaultValue} {
            width: auto;
        }
    }
`;

const StyledDropdown = styled(Dropdown)`
    overflow: hidden;
    text-overflow: ellipsis;
`;

interface DropdownMenuItem {
    key: string;
    label: React.ReactNode;
    callback?: () => boolean | void;
    'data-test'?: string;
}

interface Props {
    defaultVisibleValue?: React.ReactNode;
    dropdownOptions?: DropdownMenuItem[];
    payload: MetadataAddPayload;
}

const getLocalizedActions = (type: MetadataAddPayload['type']) => {
    const defaultMessages = {
        add: <Translation id="TR_LABELING_ADD_LABEL" />,
        edit: <Translation id="TR_LABELING_EDIT_LABEL" />,
        remove: <Translation id="TR_LABELING_REMOVE_LABEL" />,
    };
    switch (type) {
        case 'outputLabel':
            return {
                add: <Translation id="TR_LABELING_ADD_OUTPUT" />,
                edit: <Translation id="TR_LABELING_EDIT_OUTPUT" />,
                remove: <Translation id="TR_LABELING_REMOVE_OUTPUT" />,
            };
        case 'addressLabel':
            return {
                add: <Translation id="TR_LABELING_ADD_ADDRESS" />,
                edit: <Translation id="TR_LABELING_EDIT_ADDRESS" />,
                remove: <Translation id="TR_LABELING_REMOVE_ADDRESS" />,
            };
        case 'accountLabel':
            return {
                add: <Translation id="TR_LABELING_ADD_ACCOUNT" />,
                edit: <Translation id="TR_LABELING_EDIT_ACCOUNT" />,
                remove: <Translation id="TR_LABELING_REMOVE_ACCOUNT" />,
            };
        case 'walletLabel':
            return {
                add: <Translation id="TR_LABELING_ADD_WALLET" />,
                edit: <Translation id="TR_LABELING_EDIT_WALLET" />,
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

    let deviceMetadata: DeviceMetadata | undefined;
    if (device) {
        deviceMetadata = device.metadata;
    }

    const { addMetadata, init, setEditing } = useActions({
        addMetadata: metadataActions.addMetadata,
        init: metadataActions.init,
        setEditing: metadataActions.setEditing,
    });

    // is everything ready (more or less) to add label?
    const labelingAvailable = !!(
        metadata.enabled &&
        deviceMetadata?.status === 'enabled' &&
        metadata.provider
    );

    // labeling is possible (it is possible to make it available) when we may obtain keys from device. If enabled, we already have them
    // (and only need to connect provider), or if device is connected, we may initiate TrezorConnect.CipherKeyValue call and get them
    const labelingPossible = device?.metadata.status === 'enabled' || device?.connected;

    const l10nLabelling = getLocalizedActions(props.payload.type);

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

    const onSubmit = (value: string | undefined | null) => {
        addMetadata({
            ...props.payload,
            value: value || undefined,
        });
    };

    let dropdownItems: DropdownMenuItem[] = [
        {
            callback: () => activateEdit(),
            label: l10nLabelling.edit,
            'data-test': '@metadata/edit-button',
            key: 'edit-label',
        },
    ];

    if (labelingAvailable) {
        dropdownItems.push({
            callback: () => onSubmit(''),
            label: l10nLabelling.remove,
            'data-test': '@metadata/remove-button',
            key: 'remove-label',
        });
    }

    if (props.dropdownOptions) {
        dropdownItems = [...dropdownItems, ...props.dropdownOptions];
    }

    const dataTestBase = `@metadata/${props.payload.type}/${props.payload.defaultValue}`;

    if (metadata.initiating) return <span>loading...</span>;

    if (
        metadata.editing === props.payload.defaultValue &&
        !metadata.initiating &&
        metadata.enabled &&
        deviceMetadata?.status === 'enabled'
    ) {
        return (
            <MetadataEdit
                originalValue={props.payload.value}
                onSubmit={onSubmit}
                onBlur={() => {
                    setEditing(undefined);
                }}
            />
        );
    }

    return (
        <LabelContainer>
            {/* props.payload.value is the label for the account */}
            {props.payload.value ? (
                <StyledDropdown
                    alignMenu="left"
                    items={[{ options: dropdownItems, key: 'dropdown' }]}
                    absolutePosition
                    appendTo={document.body}
                >
                    <Label data-test={dataTestBase}>
                        <LabelValue>{props.payload.value}</LabelValue>
                        {/* This is the defaultVisibleValue which shows up after you hover over the label name */}
                        {props.defaultVisibleValue && (
                            <LabelDefaultValue>{props.defaultVisibleValue}</LabelDefaultValue>
                        )}
                    </Label>
                </StyledDropdown>
            ) : (
                props.defaultVisibleValue // defaultVisibleValue looks like "Ethereum #1" in Suite
            )}

            {labelingPossible && !props.payload.value && (
                <AddLabelButton
                    data-test={`${dataTestBase}/add-label-button`}
                    variant="tertiary"
                    icon={!isDiscoveryRunning ? 'TAG' : undefined}
                    isLoading={isDiscoveryRunning}
                    isDisabled={isDiscoveryRunning}
                    onClick={e => {
                        e.stopPropagation();
                        // by clicking on add label button, metadata.editing field is set
                        // to default value of whatever may be labeled (address, etc..)
                        // this way we ensure that only one field may be active at time
                        activateEdit();
                    }}
                >
                    {!isDiscoveryRunning ? l10nLabelling.add : 'Loading...'}
                </AddLabelButton>
            )}
        </LabelContainer>
    );
};

export default MetadataLabeling;
