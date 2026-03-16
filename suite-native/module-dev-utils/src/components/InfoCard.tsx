import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectAnalyticsInstanceId } from '@suite-common/analytics-redux';
import { Button, Card, TitleHeader, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { getEnv, isDevelopOrDebugEnv } from '@suite-native/config';
import {
    type DevUtilsStackParamList,
    DevUtilsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { getCommitHash, getSuiteVersion } from '@trezor/env-utils';

type NavigationProps = StackToStackCompositeNavigationProps<
    DevUtilsStackParamList,
    DevUtilsStackRoutes.DevUtils,
    RootStackParamList
>;

export const InfoCard = () => {
    const copyToClipboard = useCopyToClipboard();
    const navigation = useNavigation<NavigationProps>();

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
                {isDevelopOrDebugEnv() && (
                    <>
                        <Button onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}>
                            See Component Demo
                        </Button>
                        <Button onPress={() => navigation.navigate(RootStackRoutes.Storybook)}>
                            StoryBook
                        </Button>
                    </>
                )}
            </VStack>
        </Card>
    );
};
