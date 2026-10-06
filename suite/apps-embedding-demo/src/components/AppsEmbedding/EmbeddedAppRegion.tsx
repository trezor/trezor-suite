import styled from 'styled-components';

// TODO: next PR
// import { DesktopEmbeddedApp } from '@suite/apps-embedding-desktop';
import { type AppsEmbeddingEvent, type PlatformSpecificOfKind } from '@suite-common/apps-embedding';
import { Button, Row, Text } from '@trezor/components';
import { isWeb } from '@trezor/env-utils';
import { type HttpsUrl } from '@trezor/type-utils';

import { EmbeddingEventLog } from './EmbeddingEventLog';
import { WebIframeEntry } from './WebIframeEntry';
import { type EmbeddingLogEntry } from './hooks/useAppsEmbeddingShowcase';

const LOG_PANE_MAX_HEIGHT = 180;

const Region = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
`;

const Toolbar = styled.div`
    padding: 12px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.borderNeutral};
`;

/**
 * The embedding surface. It must stay a plain flex child with `min-height: 0`: on desktop the slot
 * inside it reports this box to the main process as the bounds of a native view, so anything that
 * lets it grow past the region would push that view off the window.
 */
const Surface = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
`;

const LogPane = styled.div`
    max-height: ${LOG_PANE_MAX_HEIGHT}px;
    overflow: auto;
    padding: 12px 16px;
    border-top: 1px solid ${({ theme }) => theme.borderNeutral};
`;

type EmbeddedAppRegionProps = {
    targetUrl: string;
    entryId?: string;
    embedTitle: string;
    redirectExternalOrigins?: HttpsUrl[];
    popupExternalOrigins?: HttpsUrl[];
    webEntry: PlatformSpecificOfKind<'web'> | null;
    logEntries: EmbeddingLogEntry[];
    onEvent: (event: AppsEmbeddingEvent) => void;
    onClearEvents: () => void;
    onClose: () => void;
    /**
     * The native view paints above the DOM, so it has to yield to anything that covers the
     * window.
     */
    isModalOpen: boolean;
};

export const EmbeddedAppRegion = ({
    targetUrl,
    // entryId,
    embedTitle,
    // redirectExternalOrigins,
    // popupExternalOrigins,
    webEntry,
    logEntries,
    onEvent,
    onClearEvents,
    onClose,
    // isModalOpen,
}: EmbeddedAppRegionProps) => (
    <Region>
        <Toolbar>
            <Row justifyContent="space-between" gap={12}>
                <Text typographyStyle="body-md-strong">{embedTitle}</Text>
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    onClick={onClose}
                    data-testid="@settings/apps-embedding/close"
                >
                    Close
                </Button>
            </Row>
        </Toolbar>

        <Surface>
            {/* TODO: next PR */}
            {/* {isDesktop() && (
                <DesktopEmbeddedApp
                    isVisible={!isModalOpen}
                    targetUrl={targetUrl}
                    entryId={entryId}
                    redirectExternalOrigins={redirectExternalOrigins}
                    popupExternalOrigins={popupExternalOrigins}
                    onEvent={onEvent}
                />
            )} */}
            {isWeb() && (
                <WebIframeEntry
                    targetUrl={targetUrl}
                    embedTitle={embedTitle}
                    webEntry={webEntry}
                    onEvent={onEvent}
                />
            )}
        </Surface>

        <LogPane>
            <EmbeddingEventLog entries={logEntries} onClear={onClearEvents} />
        </LogPane>
    </Region>
);
