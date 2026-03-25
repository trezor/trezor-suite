import { useState } from 'react';

import {
    analyticsActions,
    selectCustomAnalyticsUrl,
    selectIsAnalyticsEnabled,
    selectLoggerEnabled,
} from '@suite-common/analytics-redux';
import { Badge, Button, Column, Input, Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

export const AnalyticsLogging = () => {
    const customAnalyticsUrl = useSelector(selectCustomAnalyticsUrl);
    const loggerEnabled = useSelector(selectLoggerEnabled);
    const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled);
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

    const renderAnalyticsDisabledBadge = () => (
        <Badge size="small" intent="warning" iconLeft="info">
            Enable analytics to see the events.
        </Badge>
    );

    return (
        <>
            <SectionItem>
                <TextColumn
                    title="Custom Analytics URL"
                    description={
                        customAnalyticsUrl && !isAnalyticsEnabled
                            ? renderAnalyticsDisabledBadge()
                            : undefined
                    }
                />
                <ActionColumn>
                    <Column gap={4}>
                        <Input
                            data-testid="@settings/debug/analytics/url-input"
                            value={inputValue}
                            placeholder="https://custom-analytics-server.example.com/log"
                            onChange={e => setInputValue(e.target.value)}
                            rightContent={
                                inputValue === customAnalyticsUrl ? (
                                    <Button
                                        data-testid="@settings/debug/analytics/reset-button"
                                        onClick={handleReset}
                                        size="small"
                                        intent="neutral"
                                    >
                                        Reset
                                    </Button>
                                ) : (
                                    <Button
                                        data-testid="@settings/debug/analytics/save-button"
                                        onClick={handleSave}
                                        size="small"
                                    >
                                        Save
                                    </Button>
                                )
                            }
                        />
                    </Column>
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn
                    title="Console Logging"
                    description={
                        <>
                            Log analytics events to the browser console for debugging
                            {loggerEnabled && !isAnalyticsEnabled && (
                                <div style={{ marginTop: 8 }}>{renderAnalyticsDisabledBadge()}</div>
                            )}
                        </>
                    }
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
