import { useState } from 'react';
import styled from 'styled-components';

import { selectLogs } from '@suite-common/logger';
import {
    Switch,
    NewModal,
    Card,
    Paragraph,
    Text,
    Row,
    Column,
    H4,
    variables,
    useScrollShadow,
} from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { getApplicationInfo, getApplicationLog, prettifyLog } from 'src/utils/suite/logsUtils';
import { spacings, spacingsPx } from '@trezor/theme';

const ScrollContainer = styled.div`
    overflow: auto;
`;

const LogWrapper = styled.pre`
    padding: ${spacingsPx.md};
    height: 350px;
    width: 100%;
    text-align: left;
    word-break: break-all;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        height: 320px;
    }

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        height: 280px;
    }
`;

type ApplicationLogModalProps = { onCancel: () => void };

export const ApplicationLogModal = ({ onCancel }: ApplicationLogModalProps) => {
    const [hideSensitiveInfo, setHideSensitiveInfo] = useState(false);
    const logs = useSelector(selectLogs);
    const state = useSelector(state => state);
    const { ShadowTop, ShadowBottom, ShadowContainer, onScroll, scrollElementRef } =
        useScrollShadow();

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
        <NewModal
            onCancel={onCancel}
            heading={<Translation id="TR_LOG" />}
            description={<Translation id="LOG_DESCRIPTION" />}
            data-testid="@modal/application-log"
            bottomContent={
                <NewModal.Button onClick={download} data-testid="@log/export-button">
                    <Translation id="TR_EXPORT_TO_FILE" />
                </NewModal.Button>
            }
        >
            <Card paddingType="none" margin={{ top: spacings.sm }} overflow="hidden">
                <ShadowContainer>
                    <ShadowTop backgroundColor="backgroundSurfaceElevation1" />
                    <ScrollContainer onScroll={onScroll} ref={scrollElementRef}>
                        <LogWrapper data-testid="@log/content">
                            <Text typographyStyle="label">{log}</Text>
                        </LogWrapper>
                    </ScrollContainer>
                    <ShadowBottom backgroundColor="backgroundSurfaceElevation1" />
                </ShadowContainer>
            </Card>

            <Row margin={{ top: spacings.xl }} gap={spacings.xxxxl}>
                <Column gap={spacings.xxs} alignItems="flex-start">
                    <H4>
                        <Translation id="LOG_INCLUDE_BALANCE_TITLE" />
                    </H4>
                    <Paragraph variant="tertiary" typographyStyle="hint">
                        <Translation id="LOG_INCLUDE_BALANCE_DESCRIPTION" />
                    </Paragraph>
                </Column>
                <Switch
                    isChecked={!hideSensitiveInfo}
                    onChange={() => setHideSensitiveInfo(!hideSensitiveInfo)}
                />
            </Row>
        </NewModal>
    );
};
