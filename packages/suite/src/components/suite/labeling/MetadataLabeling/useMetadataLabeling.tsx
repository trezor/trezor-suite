import { useEffect, useState, useMemo, useRef } from 'react';

import { DropdownMenuItemProps } from '@trezor/components';
import type { TimerId } from '@trezor/type-utils';
import { StaticSessionId } from '@trezor/connect';

import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { addMetadata, init, setEditing } from 'src/actions/suite/metadataLabelingActions';
import { MetadataAddPayload } from 'src/types/suite/metadata';
import { Translation } from 'src/components/suite';
import {
    selectIsLabelingAvailableForEntity,
    selectIsLabelingInitPossible,
} from 'src/reducers/suite/metadataReducer';

import { Props } from './definitions';

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
export const useMetadataLabeling = ({
    payload,
    defaultVisibleValue,
    defaultEditableValue,

    accountType,
    networkType,
    path,
    dropdownOptions,
    isDisabled,
    visible,
    updateFlag,
}: Props) => {
    const metadata = useSelector(state => state.metadata);
    const dispatch = useDispatch();
    const { isDiscoveryRunning } = useDiscovery();
    const [showSuccess, setShowSuccess] = useState(false);
    const [pending, setPending] = useState(false);

    console.log('___P', payload);
    const l10nLabelling = getLocalizedActions(payload.type);
    const dataTestBase = `@metadata/${payload.type}/${payload.defaultValue}`;
    const isDisabled = isDiscoveryRunning || pending;
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

    const isLabelingInitPossible = useSelector(selectIsLabelingInitPossible);
    const deviceState =
        payload.type === 'walletLabel' ? (payload.entityKey as StaticSessionId) : undefined;
    const isLabelingAvailable = useSelector(state =>
        selectIsLabelingAvailableForEntity(state, payload.entityKey, deviceState),
    );

    // is this concrete instance being edited?
    const editActive = metadata.editing === payload.defaultValue;

    const activateEdit = () => {
        // When clicking on inline input edit, ensure that everything needed is already ready.
        if (
            // Isn't initiation in progress?
            !metadata.initiating &&
            // Is there something that needs to be initiated?
            !isLabelingAvailable
        ) {
            dispatch(
                init(
                    // Provide force=true argument (user wants to enable metadata).
                    true,
                    // If this is wallet(device) label, provide unique identifier entityKey which equals to device.state.
                    deviceState,
                ),
            );
        }
        dispatch(setEditing(payload.defaultValue));
    };

    let dropdownItems: DropdownMenuItemProps[] = [
        {
            onClick: () => activateEdit(),
            label: l10nLabelling.edit,
            'data-testid': `edit-label`, // Hack: This will be prefixed in the withDropdown()
        },
    ];

    const handleBlur = () => {
        if (!metadata.initiating) {
            dispatch(setEditing(undefined));
        }
    };

    const defaultOnSubmit = async (value: string | undefined) => {
        isSubscribedToSubmitResult.current = payload.defaultValue;
        setPending(true);
        const result = await dispatch(
            addMetadata({
                ...payload,
                value: value || undefined,
            }),
        );
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
    };

    // const ButtonLikeLabelWithDropdown = useMemo(() => {
    //     if (payload.value) {
    //         return withDropdown(ButtonLikeLabel);
    //     }
    //
    //     return ButtonLikeLabel;
    // }, [payload.value]);

    const labelContainerDataTest = `${dataTestBase}/hover-container`;

    // Should "add label"/"edit label" button be visible?
    const showActionButton =
        !isDisabled &&
        (isLabelingAvailable || isLabelingInitPossible) &&
        !showSuccess &&
        !editActive;
    const isVisible = pending || visible;

    // Metadata is still initiating, on hover, show only disabled button with spinner.
    // if (metadata.initiating)
    //     return (
    //         <LabelContainer data-testid={labelContainerDataTest}>
    //             {defaultVisibleValue}
    //             <ActionButton variant="tertiary" isDisabled isLoading size="tiny">
    //                 <Translation id="TR_LOADING" />
    //             </ActionButton>
    //         </LabelContainer>
    //     );

    // should "add label"/"edit label" button for output label be visible
    // special case here. It should not be visible if metadata label already exists (payload.value) because
    // this type of labels has dropdown menu instead of "add/edit label button".
    // but we still want to show pending and success status after editing the label.
    const showOutputLabelActionButton =
        showActionButton && (!payload.value || (payload.value && pending));

    return {
        accountType,
        networkType,
        path,
        editActive,
        defaultVisibleValue,
        defaultEditableValue,
        payload,
        onSubmit: defaultOnSubmit,
        onBlur: handleBlur,
        updateFlag,
        isDisabled,
        l10nLabelling,
    };
};
