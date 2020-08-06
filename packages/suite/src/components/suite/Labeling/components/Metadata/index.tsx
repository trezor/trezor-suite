import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Icon, Dropdown, colors } from '@trezor/components';
import styled from 'styled-components';
import { useActions, useSelector } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import { MetadataAddPayload } from '@suite-types/metadata';
// import metadataReducer from '@suite/reducers/suite/metadataReducer';

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
    // background-color: ${({ color }) => color || colors.NEUE_BG_LIGHT_GREY};
    // color: ${colors.NEUE_TYPE_DARK_GREY};
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
    console.log('[editing]: render');

    const submit = useCallback(
        value => {
            console.log('submit, value', value);
            props.onSubmit(value);

            if (divRef && divRef.current) {
                divRef.current.blur();
            }
        },
        [props, divRef],
    );

    useEffect(() => {
        console.log('[editing]: use effect', props.originalValue);
        // todo: if enabling labeling for the first time, focus is lost. I don't know how  to fix this. Otherwise it works;
        if (divRef && divRef.current) {
            divRef.current.textContent = props.originalValue || null;
            divRef.current.focus();
            console.log('SETTING FOCUS MDFTK!!!!');

            console.log(divRef);
            moveCaretToEndOfContentEditable(divRef.current);
        }
    }, [props]);

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
            console.log(event.keyCode);

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
                size={16}
                data-test="@metadata/submit"
                icon="CHECK"
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('on submittimtiit');
                    submit(
                        divRef && divRef.current ? divRef.current.textContent : props.originalValue,
                    );
                }}
                color={colors.NEUE_BG_LIGHT_GREEN}
            />
            <SubmitIcon
                size={16}
                data-test="@metadata/cancel"
                icon="CROSS"
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
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
    const deviceMetadata = useSelector(state => state.suite.device?.metadata);

    const { addMetadata, initMetadata } = useActions({
        addMetadata: metadataActions.addMetadata,
        initMetadata: metadataActions.init,
    });

    useEffect(() => {
        console.log('====use effect');
        if (editing && !loading && (!metadata.enabled || deviceMetadata?.status !== 'enabled')) {
            const init = async () => {
                setLoading(true);
                const result = await initMetadata(true);
                console.log('=== result', result);
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

        setEditing(false);
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
                    icon="LABEL"
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

    // const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
};

export default AddMetadataLabel;
