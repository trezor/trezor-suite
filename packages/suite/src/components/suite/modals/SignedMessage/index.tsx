import React, { createRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { Switch, Button, Modal, colors, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import * as notificationActions from '@suite-actions/notificationActions';
import { useActions } from '@suite-hooks';
import { SectionItem, ActionColumn, TextColumn } from '@suite-components/Settings';
import { copyToClipboard } from '@suite-utils/dom';

const LogWrapper = styled.pre`
    padding: 20px;
    height: 400px;
    width: 100%;
    overflow: auto;
    background-color: ${colors.BLACK96};
    color: ${colors.BLACK0};
    font-size: ${variables.FONT_SIZE.TINY};
    text-align: left;
    word-break: break-all;
`;

const ButtonWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
`;

type Props = {
    onCancel: () => void;
    signedObj: {
        address: string;
        message: string;
        signature: string;
    };
};

const SignedMessage = ({ signedObj, onCancel }: Props) => {
    const { addNotification } = useActions({
        addNotification: notificationActions.addToast,
    });

    const htmlElement = createRef<HTMLPreElement>();
    const prettifyLog = (json: Record<any, any>) => {
        return { text: JSON.stringify(json, null, 2), isStringifiedJSON: true };
    };
    const [signedTextObj, setSignedTextObj] = useState(prettifyLog(signedObj));

    const toggleToPlainText = () => {
        if (signedTextObj.isStringifiedJSON) {
            setSignedTextObj({
                text: `Address: ${signedObj.address}\nMessage: ${signedObj.message}\nSignature: ${signedObj.signature}`,
                isStringifiedJSON: false,
            });
        } else {
            setSignedTextObj(prettifyLog(signedObj));
        }
    };

    const copy = () => {
        const result = copyToClipboard(signedTextObj.text, htmlElement.current);
        if (typeof result !== 'string') {
            addNotification({ type: 'copy-to-clipboard' });
        }
    };

    useEffect(copy, []); // componentDidMount, copy at first appear

    const download = () => {
        const element = document.createElement('a');
        element.setAttribute(
            'href',
            `data:text/plain;charset=utf-8,${encodeURIComponent(signedTextObj.text)}`,
        );
        element.setAttribute('download', 'signed-message.txt');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <Modal
            cancelable
            onCancel={onCancel}
            heading={<Translation id="TR_SUCCESS_COPIED" />}
            description={<Translation id="TR_SIGNED_MESSAGE_MODAL_HEADING" />}
            bottomBar={
                <ButtonWrapper>
                    <Button variant="secondary" onClick={() => copy()} data-test="@log/copy-button">
                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => download()}
                        data-test="@log/export-button"
                    >
                        <Translation id="TR_EXPORT_TO_FILE" />
                    </Button>
                </ButtonWrapper>
            }
        >
            <LogWrapper ref={htmlElement}>{signedTextObj.text}</LogWrapper>
            <SectionItem>
                <TextColumn
                    title={
                        <Translation
                            id={
                                signedTextObj.isStringifiedJSON
                                    ? 'TR_SHOW_PLAIN_TEXT'
                                    : 'TR_SHOW_JSON_FORMAT'
                            }
                        />
                    }
                    description={<Translation id="TR_TIP_SELECT_FORMAT" />}
                />
                <ActionColumn>
                    <Switch
                        checked={!signedTextObj.isStringifiedJSON}
                        onChange={() => {
                            toggleToPlainText();
                        }}
                    />
                </ActionColumn>
            </SectionItem>
        </Modal>
    );
};

export default SignedMessage;
