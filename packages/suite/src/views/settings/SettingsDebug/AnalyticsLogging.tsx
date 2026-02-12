import { useState } from 'react';

import {
    analyticsActions,
    selectCustomAnalyticsUrl,
    selectLoggerEnabled,
} from '@suite-common/analytics-redux';
import { Button, Code, Column, Input, Switch, Text } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

export const AnalyticsLogging = () => {
    const customAnalyticsUrl = useSelector(selectCustomAnalyticsUrl);
    const loggerEnabled = useSelector(selectLoggerEnabled);
    const dispatch = useDispatch();
    const analytics = useAnalytics();

    const [inputValue, setInputValue] = useState(customAnalyticsUrl ?? '');

    const handleSave = () => {
        const trimmedUrl = inputValue.trim();
        const url = trimmedUrl || undefined;
        dispatch(analyticsActions.setCustomAnalyticsUrl(url));
        analytics.setUrl(url);
    };

    const handleReset = () => {
        setInputValue('');
        dispatch(analyticsActions.setCustomAnalyticsUrl(undefined));
        analytics.setUrl(undefined);
    };

    return (
        <>
            <SectionItem>
                <TextColumn title="Custom Analytics URL" />
                <ActionColumn>
                    <Column gap={4}>
                        <Input
                            data-testid="@settings/debug/analytics/url-input"
                            value={inputValue}
                            placeholder="https://custom-analytics-server.example.com/log"
                            onChange={e => setInputValue(e.target.value)}
                            rightContent={
                                <Button
                                    data-testid="@settings/debug/analytics/save-button"
                                    onClick={handleSave}
                                    size="small"
                                >
                                    Save
                                </Button>
                            }
                        />
                        {customAnalyticsUrl && (
                            <Column gap={4} alignItems="flex-end">
                                <Text typographyStyle="hint" variant="tertiary">
                                    Current: <Code>{customAnalyticsUrl}</Code>
                                </Text>
                                <Button
                                    data-testid="@settings/debug/analytics/reset-button"
                                    onClick={handleReset}
                                    size="small"
                                    intent="critical"
                                >
                                    Reset to Default
                                </Button>
                            </Column>
                        )}
                    </Column>
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn
                    title="Console Logging"
                    description="Log analytics events to the browser console for debugging"
                />
                <ActionColumn>
                    <Switch
                        data-testid="@settings/debug/analytics/logger-switch"
                        isChecked={!!loggerEnabled}
                        onChange={() => {
                            const newValue = !loggerEnabled;
                            dispatch(analyticsActions.setLoggerEnabled(newValue));
                            analytics.setLoggerEnabled(newValue);
                        }}
                    />
                </ActionColumn>
            </SectionItem>
        </>
    );
};
