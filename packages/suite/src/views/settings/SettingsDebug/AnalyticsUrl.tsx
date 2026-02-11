import { useState } from 'react';

import { Button, Code, Column, Input, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { setDebugMode } from 'src/actions/suite/suiteActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

export const AnalyticsUrl = () => {
    const debug = useSelector(state => state.suite.settings.debug);
    const dispatch = useDispatch();
    const analytics = useAnalytics();

    const [inputValue, setInputValue] = useState(debug.customAnalyticsUrl ?? '');

    const handleSave = () => {
        const trimmedUrl = inputValue.trim();
        const url = trimmedUrl || undefined;
        dispatch(setDebugMode({ customAnalyticsUrl: url }));
        analytics.setUrl(url);
    };

    const handleReset = () => {
        setInputValue('');
        dispatch(setDebugMode({ customAnalyticsUrl: undefined }));
        analytics.setUrl(undefined);
    };

    return (
        <SectionItem>
            <TextColumn
                title="Analytics URL"
                description="Override the analytics endpoint URL. Leave empty and save to use the default."
            />
            <ActionColumn>
                <Column gap={spacings.xxs}>
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
                    {debug.customAnalyticsUrl && (
                        <Column gap={spacings.xxs}>
                            <Text typographyStyle="hint" variant="tertiary">
                                Current: <Code>{debug.customAnalyticsUrl}</Code>
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
