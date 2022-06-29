import React, { createRef, useState } from 'react';
import styled from 'styled-components';
import { Switch, Button, variables } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import { useSelector, useActions } from '@suite-hooks';
import * as notificationActions from '@suite-actions/notificationActions';
import { SectionItem, ActionColumn, TextColumn } from '@suite-components/Settings';
import { copyToClipboard } from '@suite-utils/dom';
import { getApplicationInfo, getApplicationLog, prettifyLog } from '@suite-utils/logsUtils';

const LogWrapper = styled.pre`
    padding: 20px;
    height: 400px;
    width: 100%;
    overflow: auto;
    background-color: ${props => props.theme.BG_LIGHT_GREY};
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    text-align: left;
    word-break: break-all;
`;

type ApplicationLogProps = { onCancel: () => void };

export const ApplicationLog = ({ onCancel }: ApplicationLogProps) => {
    const htmlElement = createRef<HTMLPreElement>();
    const [hideSensitiveInfo, setHideSensitiveInfo] = useState(false);

    const { state, logs } = useSelector(state => ({ state, logs: state.logs }));
    const { addToast } = useActions({ addToast: notificationActions.addToast });

    const actionLog = getApplicationLog(logs, hideSensitiveInfo);
    const applicationInfo = getApplicationInfo(state);

    const log = prettifyLog([applicationInfo, ...actionLog]);

    const copy = () => {
        const result = copyToClipboard(log, htmlElement.current);
        if (typeof result !== 'string') {
            addToast({ type: 'copy-to-clipboard' });
        }
    };

    const download = () => {
        const element = document.createElement('a');
        element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(log)}`);
        element.setAttribute('download', 'trezor-suite-log.txt');

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    };

    return (
        <Modal
            isCancelable
            onCancel={onCancel}
            heading={<Translation id="TR_LOG" />}
            description={<Translation id="LOG_DESCRIPTION" />}
            data-test="@modal/application-log"
            bottomBar={
                <>
                    <Button variant="secondary" onClick={copy} data-test="@log/copy-button">
                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                    </Button>
                    <Button variant="secondary" onClick={download} data-test="@log/export-button">
                        <Translation id="TR_EXPORT_TO_FILE" />
                    </Button>
                </>
            }
        >
            <LogWrapper ref={htmlElement} data-test="@log/content">
                {log}
            </LogWrapper>
            <SectionItem>
                <TextColumn
                    title={<Translation id="LOG_INCLUDE_BALANCE_TITLE" />}
                    description={<Translation id="LOG_INCLUDE_BALANCE_DESCRIPTION" />}
                />
                <ActionColumn>
                    <Switch
                        isChecked={!hideSensitiveInfo}
                        onChange={() => setHideSensitiveInfo(!hideSensitiveInfo)}
                    />
                </ActionColumn>
            </SectionItem>
        </Modal>
    );
};
