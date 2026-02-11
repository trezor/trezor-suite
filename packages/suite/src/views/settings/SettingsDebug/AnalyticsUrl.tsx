import { useState } from 'react';

import { analyticsActions, selectCustomAnalyticsUrl } from '@suite-common/analytics-redux';
import { Button, Code, Column, Input, Text } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

export const AnalyticsUrl = () => {
    const customAnalyticsUrl = useSelector(selectCustomAnalyticsUrl);
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
        <SectionItem>
            <TextColumn
                title="Analytics URL"
                description="Override the analytics endpoint URL. Leave empty and save to use the default."
            />
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
    );
};
