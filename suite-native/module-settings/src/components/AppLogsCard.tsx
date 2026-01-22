import { useState } from 'react';

import { prettifyLog, useCommonApplicationLogs as useApplicationLogs } from '@suite-common/logger';
import {
    BottomSheetModal,
    Button,
    Card,
    CompactCardWithIconLayout,
    HStack,
    Switch,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { shareAsTextFile } from '@suite-native/helpers';

// FIXME: this is only POC UI, it will be adjusted to the official design later in follow up PRs.
export const AppLogsCard = () => {
    const areAppLogsEnabled = useFeatureFlag(FeatureFlag.AreAppLogsEnabled);

    const [hideSensitiveInfo, setHideSensitiveInfo] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { bottomSheetRef, openModal } = useBottomSheetModal();
    const applicationLogs = useApplicationLogs(hideSensitiveInfo);
    const stringifiedApplicationLogs = applicationLogs ? prettifyLog(applicationLogs) : '';

    const shareLogsAsFile = async () => {
        setIsLoading(true);

        const formattedTimestamp = new Date().toLocaleDateString('en-GB').replace(/\//g, '-'); // DD-MM-YYYY
        const filename = `trezor-suite-mobile-log-${formattedTimestamp}.txt`;

        await shareAsTextFile({ filename, textContent: stringifiedApplicationLogs });
        setIsLoading(false);
    };

    if (!areAppLogsEnabled) return null;

    return (
        <>
            <CompactCardWithIconLayout title="App logs" icon="copy" onPress={openModal} />
            <BottomSheetModal
                style={{}}
                title="App Logs:"
                ref={bottomSheetRef}
                isCloseDisplayed
                footer={
                    <VStack paddingHorizontal="sp16" paddingTop="sp16">
                        <HStack>
                            <Text>Hide sensitive info</Text>
                            <Switch isChecked={hideSensitiveInfo} onChange={setHideSensitiveInfo} />
                        </HStack>
                        <Button
                            viewLeft="shareNetwork"
                            onPress={shareLogsAsFile}
                            isLoading={isLoading}
                            isDisabled={!applicationLogs}
                        >
                            Share as file
                        </Button>
                    </VStack>
                }
            >
                <VStack spacing="sp32" flexShrink={1} justifyContent="flex-end">
                    <Card>
                        <Text>{stringifiedApplicationLogs}</Text>
                    </Card>
                </VStack>
            </BottomSheetModal>
        </>
    );
};
