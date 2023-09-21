import { useRef, useState } from 'react';
import styled from 'styled-components';

import { selectLogs } from '@suite-common/logger';
import { Switch, Button, variables } from '@trezor/components';

import { ActionColumn, Modal, TextColumn, Translation } from 'src/components/suite';
import { SectionItem } from 'src/components/suite/section';
import { useSelector } from 'src/hooks/suite';
import { getApplicationInfo, getApplicationLog, prettifyLog } from 'src/utils/suite/logsUtils';

const LogWrapper = styled.pre`
    padding: 20px;
    height: 380px;
    width: 100%;
    overflow: auto;
    background-color: ${({ theme }) => theme.BG_LIGHT_GREY};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    text-align: left;
    word-break: break-all;
    box-shadow: inset 0 0 6px -2px ${({ theme }) => theme.BG_GREY};
    border-radius: 6px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        height: 365px;
    }

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        height: 330px;
    }
`;

const BalanceInfoSection = styled(SectionItem)`
    :not(:first-child) {
        > div {
            border-top: 0;
        }
    }
`;

type ApplicationLogModalProps = { onCancel: () => void };

export const ApplicationLogModal = ({ onCancel }: ApplicationLogModalProps) => {
    const htmlElement = useRef<HTMLPreElement>(null);
    const [hideSensitiveInfo, setHideSensitiveInfo] = useState(false);
    const logs = useSelector(selectLogs);

    const state = useSelector(state => state);

    const actionLog = getApplicationLog(logs, hideSensitiveInfo);
    const applicationInfo = getApplicationInfo(state, hideSensitiveInfo);

    const log = prettifyLog([applicationInfo, ...actionLog]);

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
            bottomBarComponents={
                <Button variant="secondary" onClick={download} data-test="@log/export-button">
                    <Translation id="TR_EXPORT_TO_FILE" />
                </Button>
            }
        >
            <LogWrapper ref={htmlElement} data-test="@log/content">
                {log}
            </LogWrapper>

            <BalanceInfoSection>
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
            </BalanceInfoSection>
        </Modal>
    );
};
