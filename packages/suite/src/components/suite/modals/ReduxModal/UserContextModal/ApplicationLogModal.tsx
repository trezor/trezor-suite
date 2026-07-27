import { useState } from 'react';

import styled from 'styled-components';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import {
    Card,
    Column,
    H4,
    Modal,
    Paragraph,
    Row,
    Switch,
    Text,
    useScrollShadow,
    variables,
} from '@trezor/components';

import { useApplicationLogs } from 'src/utils/suite/logsUtils';

const ScrollContainer = styled.div`
    overflow: auto;
`;

const LogWrapper = styled.pre`
    padding: 16px;
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
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const [hideSensitiveInfo, setHideSensitiveInfo] = useState(false);
    const applicationLogs = useApplicationLogs({ hideSensitiveInfo });
    const { ShadowTop, ShadowBottom, ShadowContainer, onScroll, scrollElementRef } =
        useScrollShadow();

    const download = () => {
        if (applicationLogs === null) return;

        analytics.report({
            type: events.settingsAppLogExportedEvent.name,
            payload: {
                isRedacted: hideSensitiveInfo,
            },
        });

        const element = document.createElement('a');
        element.setAttribute(
            'href',
            `data:text/plain;charset=utf-8,${encodeURIComponent(applicationLogs)}`,
        );
        element.setAttribute('download', 'trezor-suite-log.txt');

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    };

    // usually takes less than 100 ms, so it's ok to delay display without a loader component
    if (applicationLogs === null) return null;

    return (
        <Modal
            onCancel={onCancel}
            heading={<Translation id="TR_LOG" />}
            description={<Translation id="LOG_DESCRIPTION" />}
            data-testid="@modal/application-log"
            bottomContent={
                <Modal.Button onClick={download} data-testid="@log/export-button">
                    <Translation id="TR_EXPORT_TO_FILE" />
                </Modal.Button>
            }
        >
            <Card paddingType="none" margin={{ top: 12 }} overflow="hidden">
                <ShadowContainer>
                    <ShadowTop />
                    <ScrollContainer onScroll={onScroll} ref={scrollElementRef}>
                        <LogWrapper data-testid="@log/content">
                            <Text typographyStyle="body-xs">{applicationLogs}</Text>
                        </LogWrapper>
                    </ScrollContainer>
                    <ShadowBottom />
                </ShadowContainer>
            </Card>

            <Row margin={{ top: 24 }} gap={48}>
                <Column gap={4} alignItems="flex-start">
                    <H4>
                        <Translation id="LOG_INCLUDE_BALANCE_TITLE" />
                    </H4>
                    <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                        <Translation id="LOG_INCLUDE_BALANCE_DESCRIPTION" />
                    </Paragraph>
                </Column>
                <Switch
                    isChecked={!hideSensitiveInfo}
                    onChange={() => setHideSensitiveInfo(!hideSensitiveInfo)}
                />
            </Row>
        </Modal>
    );
};
