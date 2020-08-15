import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Icon, Dropdown, colors } from '@trezor/components';
import styled from 'styled-components';
import { useActions, useSelector } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import { MetadataAddPayload } from '@suite-types/metadata';

const LabelDefaultValue = styled.div`
    min-width: 0;
    max-width: 0;
    transition: all 1s;
    text-overflow: ellipsis;

    &::before {
        content: ':';
    }
`;

const LabelValue = styled.div``;

const Label = styled.div`
    cursor: pointer;
    display: flex;
    overflow: hidden;
`;

const AddLabelButton = styled(Button)`
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.4s;
`;

const SubmitIcon = styled(Icon)`
    background-color: ${colors.BLACK17};
    color: ${colors.NEUE_BG_LIGHT_GREY};
    padding: 0 2px;
    margin: 0 2px;
    border-radius: 4px;
`;

const LabelContainer = styled.div`
    display: flex;
    white-space: nowrap;
    &:hover {
        ${AddLabelButton} {
            visibility: visible;
            opacity: 1;
        }
        ${LabelDefaultValue} {
            max-width: 440px;
        }
    }
`;

const moveCaretToEndOfContentEditable = (contentEditableElement: HTMLElement) => {
    // copied from https://stackoverflow.com/questions/36284973/set-cursor-at-the-end-of-content-editable
    let range;
    let selection;
    if (document.createRange) {
        range = document.createRange(); // Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement); // Select the entire contents of the element with the range
        range.collapse(false); // collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection(); // get the selection object (allows you to change selection)
        if (selection) {
            selection.removeAllRanges(); // remove any selections already made
            selection.addRange(range); // make the range you have just created the visible selection
        }
    }
};

const EditContainer = (props: {
    originalValue?: string;
    onSubmit: (value: string | undefined | null) => void;
    onBlur: () => void;
}) => {
    const divRef = useRef<HTMLDivElement>(null);
    const submit = useCallback(
        value => {
            if (value && value !== props.originalValue) {
                props.onSubmit(value);
            }

            if (divRef && divRef.current) {
                divRef.current.blur();
            }
            props.onBlur();
        },
        [props, divRef],
    );

    useEffect(() => {
        // todo: if enabling labeling for the first time, focus is lost. I don't know how  to fix this. Otherwise it works;
        if (divRef && divRef.current) {
            divRef.current.textContent = props.originalValue || null;
            divRef.current.focus();
            moveCaretToEndOfContentEditable(divRef.current);
        }
    }, [props]);

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
            switch (event.keyCode) {
                // tab
                case 9:
                    event.preventDefault();
                    break;
                // enter,
                case 13:
                    if (divRef && divRef.current) {
                        submit(divRef.current.textContent);
                    }
                    break;
                // escape
                case 27:
                    submit(props.originalValue);
                    break;
                default: // no default;
            }
        };

        window.addEventListener('keydown', keyboardHandler, false);

        return () => {
            window.removeEventListener('keydown', keyboardHandler, false);
        };
    }, [submit, props.originalValue]);

    return (
        <div style={{ display: 'flex' }}>
            {/* @ts-ignore */}
            <div
                style={{ minWidth: '40px', paddingLeft: '2px' }}
                contentEditable
                ref={divRef}
                data-test="@metadata/input"
            />
            <SubmitIcon
                style={{ cursor: 'pointer' }}
                size={16}
                data-test="@metadata/submit"
                icon="CHECK"
                onClick={() => {
                    submit(
                        divRef && divRef.current ? divRef.current.textContent : props.originalValue,
                    );
                }}
                color={colors.NEUE_BG_LIGHT_GREEN}
            />
            <SubmitIcon
                style={{ cursor: 'pointer' }}
                size={16}
                data-test="@metadata/cancel"
                icon="CROSS"
                onClick={() => {
                    submit(props.originalValue);
                }}
                color={colors.NEUE_BG_LIGHT_GREY}
            />
        </div>
    );
};

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

const AddMetadataLabel = (props: Props) => {
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const metadata = useSelector(state => state.metadata);
    const deviceState = useSelector(state => state.suite.device?.state);
    const deviceMetadata = useSelector(state => state.suite.device?.metadata);
    // I see that I may use getDiscovery or getDiscoveryForDevice actions but is that correct? In component, I should subscribe
    // to store, not call an action on its occasional re-render which may reflect real state in the and but...
    const discovery = useSelector(state => state.wallet.discovery);

    const { addMetadata, initMetadata } = useActions({
        addMetadata: metadataActions.addMetadata,
        initMetadata: metadataActions.init,
    });

    const discoveryFinished = discovery.find(d => d.deviceState === deviceState)?.status === 4;

    useEffect(() => {
        if (
            editing &&
            !loading &&
            (!metadata.enabled || deviceMetadata?.status !== 'enabled' || !metadata.provider)
        ) {
            /** when clicking on inline input edit, ensure that everything needed is already ready */
            const init = async () => {
                setLoading(true);
                const result = await initMetadata(true);
                if (!result) setEditing(false);
                setLoading(false);
            };
            init();
        }
    }, [metadata, deviceMetadata, editing, loading, initMetadata]);

    const onSubmit = (value: string | undefined | null) => {
        addMetadata({
            ...props.payload,
            value: value || undefined,
        });

        // setEditing(false);
    };

    let dropdownItems: DropdownMenuItem[] = [
        {
            callback: () => setEditing(true),
            label: 'Edit label',
            'data-test': '@metadata/edit-button',
            key: 'edit-label',
        },
        {
            callback: () => onSubmit(''),
            label: 'Remove label',
            'data-test': '@metadata/remove-button',
            key: 'remove-label',
        },
    ];

    if (props.dropdownOptions) {
        dropdownItems = [...dropdownItems, ...props.dropdownOptions];
    }

    const dataTestBase = `@metadata/${props.payload.type}/${props.payload.defaultValue}`;

    if (loading) return <span>loading...</span>;

    if (editing && !loading && metadata.enabled && deviceMetadata?.status === 'enabled') {
        return (
            <EditContainer
                originalValue={props.payload.value}
                onSubmit={onSubmit}
                onBlur={() => {
                    setEditing(false);
                }}
            />
        );
    }

    return (
        <LabelContainer>
            {props.payload.value ? (
                <Dropdown alignMenu="left" items={[{ options: dropdownItems, key: 'dropdown' }]}>
                    <Label data-test={dataTestBase}>
                        <LabelValue>{props.payload.value}</LabelValue>
                        {props.defaultVisibleValue && (
                            <LabelDefaultValue>{props.defaultVisibleValue}</LabelDefaultValue>
                        )}
                    </Label>
                </Dropdown>
            ) : (
                props.defaultVisibleValue
            )}

            {!props.payload.value && (
                <AddLabelButton
                    data-test={`${dataTestBase}/add-label-button`}
                    variant="tertiary"
                    icon={discoveryFinished ? 'LABEL' : undefined}
                    isLoading={!discoveryFinished}
                    isDisabled={!discoveryFinished}
                    onClick={e => {
                        e.stopPropagation();
                        setEditing(true);
                    }}
                >
                    Add label
                </AddLabelButton>
            )}
        </LabelContainer>
    );
};

export default AddMetadataLabel;
