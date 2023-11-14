import { useEffect, useState, useMemo, useRef } from 'react';
import styled, { useTheme } from 'styled-components';

import { Button, DropdownMenuItemProps, Icon } from '@trezor/components';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { addMetadata, init, setEditing } from 'src/actions/suite/metadataActions';
import { MetadataAddPayload } from 'src/types/suite/metadata';
import { Translation } from 'src/components/suite';
import { Props, ExtendedProps } from './definitions';
import { withEditable } from './withEditable';
import { withDropdown } from './withDropdown';
import {
    selectIsLabelingAvailableForEntity,
    selectIsLabelingInitPossible,
} from 'src/reducers/suite/metadataReducer';
import type { Timeout } from '@trezor/type-utils';

const LabelValue = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
`;

const LabelDefaultValue = styled(LabelValue)`
    /* do not shrink when the expanded label does not fit the contener - shrink only the label value */
    flex-shrink: 0;
    max-width: 0;

    /* transition max-width because it does not work with auto value */
    transition:
        max-width 0.25s,
        opacity 0.25s;
    transition-timing-function: ease-out;
    opacity: 0;

    ::before {
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
    padding-left: 1px;
    position: relative;
`;

const LabelButton = styled(Button)`
    overflow: hidden;
`;

const ActionButton = styled(Button)<{ isValueVisible?: boolean; isVisible?: boolean }>`
    margin-left: ${({ isValueVisible, isVisible, isLoading }) =>
        (isValueVisible || !isVisible || isLoading) && '12px'};
    visibility: ${({ isVisible }) => (isVisible ? 'visible' : 'hidden')};

    /* hack to keep button in place to prevent vertical jumping (if used display: none) */
    width: ${({ isVisible }) => (isVisible ? 'auto' : '0')};
`;

const SuccessButton = styled(Button)`
    cursor: wait;
    margin-left: 12px;
    width: auto;
    background-color: ${({ theme }) => theme.BG_LIGHT_GREEN};
    color: ${({ theme }) => theme.BG_GREEN};

    :hover {
        color: ${({ theme }) => theme.BG_GREEN};
        background-color: ${({ theme }) => theme.BG_LIGHT_GREEN};
    }
`;

const LabelContainer = styled.div`
    display: flex;
    white-space: nowrap;
    align-items: center;
    justify-content: flex-start;
    overflow: hidden;

    :hover {
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

const RelativeButton = styled(Button)`
    padding-bottom: 4px;
    padding-top: 4px;
    position: relative;
`;

const RelativeLabel = styled(Label)<{ isVisible?: boolean }>`
    position: relative;
`;

const ButtonLikeLabel = (props: ExtendedProps) => {
    const EditableButton = useMemo(() => withEditable(RelativeButton), []);

    if (props.editActive) {
        return (
            <EditableButton
                // @ts-expect-error todo: hm this needs some clever generic
                variant="tertiary"
                icon="TAG"
                data-test={props['data-test']}
                originalValue={props.payload.value}
                onSubmit={props.onSubmit}
                onBlur={props.onBlur}
                defaultVisibleValue={props.defaultVisibleValue}
                isButton
            />
        );
    }

    if (props.payload.value) {
        return (
            <LabelButton variant="tertiary" icon="TAG" data-test={props['data-test']}>
                <LabelValue>{props.payload.value} </LabelValue>
                {/* This is the defaultVisibleValue which shows up after you hover over the label name: */}
                {props.defaultVisibleValue && (
                    <LabelDefaultValue>{props.defaultVisibleValue}</LabelDefaultValue>
                )}
            </LabelButton>
        );
    }
    return <>{props.defaultVisibleValue}</>;
};

const TextLikeLabel = (props: ExtendedProps) => {
    const EditableLabel = useMemo(() => withEditable(RelativeLabel), []);

    if (props.editActive) {
        return (
            <EditableLabel
                data-test={props['data-test']}
                originalValue={props.payload.value}
                onSubmit={props.onSubmit}
                onBlur={props.onBlur}
                defaultVisibleValue={props.defaultVisibleValue}
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
export const MetadataLabeling = (props: Props) => {
    const metadata = useSelector(state => state.metadata);
    const dispatch = useDispatch();
    const { isDiscoveryRunning } = useDiscovery();
    const [showSuccess, setShowSuccess] = useState(false);
    const [pending, setPending] = useState(false);
    const theme = useTheme();

    const l10nLabelling = getLocalizedActions(props.payload.type);
    const dataTestBase = `@metadata/${props.payload.type}/${props.payload.defaultValue}`;
    const actionButtonsDisabled = isDiscoveryRunning || pending;
    const isSubscribedToSubmitResult = useRef(props.payload.defaultValue);
    let timeout: Timeout | undefined;
    useEffect(() => {
        setPending(false);
        setShowSuccess(false);
        return () => {
            isSubscribedToSubmitResult.current = '';
            clearTimeout(timeout!);
        };
    }, [props.payload.defaultValue, timeout]);

    const isLabelingInitPossible = useSelector(selectIsLabelingInitPossible);
    const deviceState = props.payload.type === 'walletLabel' ? props.payload.entityKey : undefined;
    const isLabelingAvailable = useSelector(state =>
        selectIsLabelingAvailableForEntity(state, props.payload.entityKey, deviceState),
    );

    // is this concrete instance being edited?
    const editActive = metadata.editing === props.payload.defaultValue;

    const activateEdit = () => {
        // when clicking on inline input edit, ensure that everything needed is already ready
        if (
            // isn't initiation in progress?
            !metadata.initiating &&
            // is there something that needs to be initiated?
            !isLabelingAvailable
        ) {
            dispatch(
                init(
                    // provide force=true argument (user wants to enable metadata)
                    true,
                    // if this is wallet(device) label, provide unique identifier entityKey which equals to device.state
                    deviceState,
                ),
            );
        }
        dispatch(setEditing(props.payload.defaultValue));
    };

    let dropdownItems: DropdownMenuItemProps[] = [
        {
            onClick: () => activateEdit(),
            label: l10nLabelling.edit,
            'data-test': '@metadata/edit-button',
            key: 'edit-label',
        },
    ];

    if (props.dropdownOptions) {
        dropdownItems = [...dropdownItems, ...props.dropdownOptions];
    }

    const handleBlur = () => {
        if (!metadata.initiating) {
            dispatch(setEditing(undefined));
        }
    };

    const onSubmit = async (value: string | undefined) => {
        isSubscribedToSubmitResult.current = props.payload.defaultValue;
        setPending(true);
        const result = await dispatch(
            addMetadata({
                ...props.payload,
                value: value || undefined,
            }),
        );
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

    const labelContainerDatatest = `${dataTestBase}/hover-container`;

    // should "add label"/"edit label" button be visible
    const showActionButton =
        !props.isDisabled &&
        (isLabelingAvailable || isLabelingInitPossible) &&
        !showSuccess &&
        !editActive;
    const isVisible = pending || props.visible;

    // metadata is still initiating, on hover, show only disabled button with spinner
    if (metadata.initiating)
        return (
            <LabelContainer data-test={labelContainerDatatest}>
                {props.defaultVisibleValue}
                <ActionButton variant="tertiary" isDisabled isLoading>
                    <Translation id="TR_LOADING" />
                </ActionButton>
            </LabelContainer>
        );

    // should "add label"/"edit label" button for output label be visible
    // special case here. It should not be visible if metadata label already exists (props.payload.value) because
    // this type of labels has dropdown menu instead of "add/edit label button".
    // but we still want to show pending and success status after editing the label.
    const showOutputLabelActionButton =
        showActionButton && (!props.payload.value || (props.payload.value && pending));

    return (
        <LabelContainer
            data-test={labelContainerDatatest}
            onClick={e => editActive && e.stopPropagation()}
        >
            {props.payload.type === 'outputLabel' ? (
                <>
                    <ButtonLikeLabelWithDropdown
                        editActive={editActive}
                        onSubmit={props.onSubmit || onSubmit}
                        onBlur={handleBlur}
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
                            isVisible={isVisible}
                            size="small"
                            isValueVisible={!!props.payload.value}
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
                        onSubmit={props.onSubmit || onSubmit}
                        onBlur={handleBlur}
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
                            isVisible={isVisible}
                            size="small"
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
                <SuccessButton variant="tertiary" data-test={`${dataTestBase}/success`}>
                    <Icon icon="CHECK" color={theme.TYPE_GREEN} size={12} /> {l10nLabelling.edited}
                </SuccessButton>
            )}
        </LabelContainer>
    );
};
