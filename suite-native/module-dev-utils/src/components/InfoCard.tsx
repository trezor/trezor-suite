import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { selectAnalyticsInstanceId } from '@suite-common/analytics-redux';
import { Card, TitleHeader, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { getEnv } from '@suite-native/config';
import { getCommitHash, getSuiteVersion } from '@trezor/env-utils';

export const InfoCard = () => {
    const copyToClipboard = useCopyToClipboard();

    const versionString = `${getEnv()}-${getSuiteVersion()}, commit ${getCommitHash() ?? 'N/A in debug build'}`;
    const instanceId = useSelector(selectAnalyticsInstanceId) ?? 'N/A';

    return (
        <Card>
            <VStack spacing="sp12">
                <Pressable onPress={() => copyToClipboard(versionString)}>
                    <TitleHeader
                        title="Build version"
                        titleSpacing="sp1"
                        subtitle={versionString}
                    />
                </Pressable>
                <Pressable onPress={() => copyToClipboard(instanceId)}>
                    <TitleHeader title="Instance ID" titleSpacing="sp1" subtitle={instanceId} />
                </Pressable>
            </VStack>
        </Card>
    );
};
