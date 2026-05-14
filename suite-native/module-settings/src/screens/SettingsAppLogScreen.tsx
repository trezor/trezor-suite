import { useState } from 'react';

import { events } from '@suite-common/analytics';
import { prettifyLog, useCommonApplicationLogs as useApplicationLogs } from '@suite-common/logger';
import {
    Button,
    Card,
    HStack,
    ScreenFooterGradient,
    Switch,
    Text,
    VStack,
} from '@suite-native/atoms';
import { shareAsTextFile } from '@suite-native/helpers';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

export const SettingsAppLogScreen = () => {
    const [includeSensitiveInfo, setIncludeSensitiveInfo] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const analytics = useAnalytics();

    const applicationLogs = useApplicationLogs(!includeSensitiveInfo);
    const stringifiedApplicationLogs = applicationLogs ? prettifyLog(applicationLogs) : '';

    const shareLogsAsFile = async () => {
        setIsLoading(true);

        analytics.report({
            type: events.settingsAppLogExportedEvent.name,
            payload: {
                isRedacted: !includeSensitiveInfo,
            },
        });

        const formattedTimestamp = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
        const filename = `trezor-suite-mobile-log-${formattedTimestamp}.txt`;

        setIsLoading(false);

        await shareAsTextFile({ filename, textContent: stringifiedApplicationLogs });
    };

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleSettings.faq.needHelp.appLog" />}
                />
            }
            footer={
                <>
                    <ScreenFooterGradient />
                    <VStack paddingBottom="sp24" paddingTop="sp8" paddingHorizontal="sp16">
                        <VStack spacing="sp24">
                            <VStack spacing="sp2">
                                <HStack justifyContent="space-between">
                                    <Text>
                                        <Translation id="moduleSettings.appLog.sensitiveDataToggle.title" />
                                    </Text>
                                    <Switch
                                        isChecked={includeSensitiveInfo}
                                        onChange={setIncludeSensitiveInfo}
                                    />
                                </HStack>
                                <Text variant="body-sm" color="contentSecondary">
                                    <Translation id="moduleSettings.appLog.sensitiveDataToggle.subtitle" />
                                </Text>
                            </VStack>
                            <Button onPress={shareLogsAsFile} isLoading={isLoading}>
                                <Translation id="moduleSettings.appLog.exportButton" />
                            </Button>
                        </VStack>
                    </VStack>
                </>
            }
        >
            <Card>
                <Text>{stringifiedApplicationLogs}</Text>
            </Card>
        </Screen>
    );
};
