import React, { createRef } from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Switch, Button, variables } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import * as notificationActions from '@suite-actions/notificationActions';
import * as logActions from '@suite-actions/logActions';
import { AppState, Dispatch } from '@suite-types';
import { SectionItem, ActionColumn, TextColumn } from '@suite-components/Settings';
import { copyToClipboard } from '@suite-utils/dom';

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
    justify-content: space-between;
`;

const mapStateToProps = (state: AppState) => ({
    log: state.log,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            addNotification: notificationActions.addToast,
            getLog: logActions.getLog,
            toggleExcludeBalanceRelated: logActions.toggleExcludeBalanceRelated,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> & {
        onCancel: () => void;
    };

const Log = (props: Props) => {
    const htmlElement = createRef<HTMLPreElement>();

    const prettifyLog = (json: Record<any, any>) => JSON.stringify(json, null, 2);

    const log = prettifyLog(props.getLog(props.log.excludeBalanceRelated));

    const copy = () => {
        const result = copyToClipboard(log, htmlElement.current);
        if (typeof result !== 'string') {
            props.addNotification({ type: 'copy-to-clipboard' });
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
                        checked={!props.log.excludeBalanceRelated}
                        onChange={props.toggleExcludeBalanceRelated}
                    />
                </ActionColumn>
            </SectionItem>
        </Modal>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Log);
