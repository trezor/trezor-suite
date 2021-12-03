import React, { createRef } from 'react';
import styled from 'styled-components';
import { Switch, Button, variables } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import { useSelector, useActions } from '@suite-hooks';
import * as notificationActions from '@suite-actions/notificationActions';
import * as logActions from '@suite-actions/logActions';
import { SectionItem, ActionColumn, TextColumn } from '@suite-components/Settings';
import { copyToClipboard } from '@suite-utils/dom';
import { prettifyLog } from '@suite-utils/logUtils';

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

const ButtonWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const StyledButton = styled(Button)`
    margin: 0 5px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
        margin: 5px 0;
    }
`;

type Props = {
    onCancel: () => void;
};

const Log = (props: Props) => {
    const htmlElement = createRef<HTMLPreElement>();

    const { excludeBalanceRelated } = useSelector(state => state.log);
    const actions = useActions({
        addNotification: notificationActions.addToast,
        getLog: logActions.getLog,
        toggleExcludeBalanceRelated: logActions.toggleExcludeBalanceRelated,
    });

    const log = prettifyLog(actions.getLog(excludeBalanceRelated));

    const copy = () => {
        const result = copyToClipboard(log, htmlElement.current);
        if (typeof result !== 'string') {
            actions.addNotification({ type: 'copy-to-clipboard' });
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
            cancelable
            onCancel={props.onCancel}
            heading={<Translation id="TR_LOG" />}
            description={<Translation id="LOG_DESCRIPTION" />}
            data-test="@log"
            bottomBar={
                <ButtonWrapper>
                    <StyledButton
                        variant="secondary"
                        onClick={() => copy()}
                        data-test="@log/copy-button"
                    >
                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                    </StyledButton>
                    <StyledButton
                        variant="secondary"
                        onClick={() => download()}
                        data-test="@log/export-button"
                    >
                        <Translation id="TR_EXPORT_TO_FILE" />
                    </StyledButton>
                </ButtonWrapper>
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
                        checked={!excludeBalanceRelated}
                        onChange={actions.toggleExcludeBalanceRelated}
                    />
                </ActionColumn>
            </SectionItem>
        </Modal>
    );
};

export default Log;
