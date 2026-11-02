import styled from 'styled-components';

import { Button, IconButton, Row, Text, Tooltip } from '@trezor/components';
import { ArrowClockwiseIcon, ArrowLeftIcon, ArrowRightIcon, CodeIcon } from '@trezor/icons';
import { safeParseUrl } from '@trezor/utils';

import { useCanOpenDevTools } from './hooks/useCanOpenDevTools';
import { useToolbarActions } from './hooks/useToolbarActions';
import { type InAppBrowserNavigationState } from '../hooks/useNavigationState';

const Bar = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.borderNeutral};
`;

// `min-width: 0` is what lets the address ellipsize rather than push the buttons off the bar: a
// flex item defaults to `min-width: auto`, which refuses to shrink below its own content.
const Address = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    min-width: 0;
`;

type ToolbarProps = {
    navigationState: InAppBrowserNavigationState;
};

export const Toolbar = ({ navigationState }: ToolbarProps) => {
    const { url, canGoBack, canGoForward } = navigationState;

    const { goBack, goForward, reload, toggleDevTools } = useToolbarActions();
    const canOpenDevTools = useCanOpenDevTools();

    return (
        <Bar>
            <Row gap={4}>
                <IconButton
                    icon={ArrowLeftIcon}
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    isDisabled={!canGoBack || goBack.isPending}
                    onClick={() => goBack.mutate()}
                    tooltip={{ content: 'Back' }}
                    aria-label="Back"
                    data-testid="@settings/apps-embedding/toolbar/back"
                />
                <IconButton
                    icon={ArrowRightIcon}
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    isDisabled={!canGoForward || goForward.isPending}
                    onClick={() => goForward.mutate()}
                    tooltip={{ content: 'Forward' }}
                    aria-label="Forward"
                    data-testid="@settings/apps-embedding/toolbar/forward"
                />
                <IconButton
                    icon={ArrowClockwiseIcon}
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    isDisabled={reload.isPending}
                    onClick={() => reload.mutate()}
                    tooltip={{ content: 'Reload' }}
                    aria-label="Reload"
                    data-testid="@settings/apps-embedding/toolbar/reload"
                />
            </Row>

            <Address>
                <Tooltip content={url} tooltipMaxWidth={480} minWidth={0}>
                    <Text
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        ellipsisLineCount={1}
                        data-testid="@settings/apps-embedding/toolbar/origin"
                    >
                        {safeParseUrl(url)?.origin ?? url}
                    </Text>
                </Tooltip>
            </Address>

            {/* Absent rather than disabled: a signed build without `--open-devtools` refuses the
            call outright, so there is nothing for the user to enable and a greyed-out control would
            only invite them to look for the switch. */}
            {canOpenDevTools && (
                <Button
                    iconLeft={CodeIcon}
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    isDisabled={toggleDevTools.isPending}
                    onClick={() => toggleDevTools.mutate()}
                    data-testid="@settings/apps-embedding/toolbar/dev-tools"
                >
                    Dev Tools
                </Button>
            )}
        </Bar>
    );
};
