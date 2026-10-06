import { View } from 'react-native';

import {
    Badge,
    Box,
    Card,
    CardDivider,
    HStack,
    Text,
    TextButton,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { MarkdownText } from '@suite-native/markdown';
import { getSuiteVersion } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { GITHUB_REPO_URL } from '@trezor/urls';

import releaseNotesMarkdown from '../../../assets/release-notes.md';

const headerCardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillSunken,
    borderTopLeftRadius: utils.borders.radii.r16,
    borderTopRightRadius: utils.borders.radii.r16,
    paddingTop: utils.spacings.sp12,
    paddingHorizontal: utils.spacings.sp12,
    paddingBottom: utils.spacings.sp32,
    marginBottom: -utils.spacings.sp20,
}));

const mainCardStyle = prepareNativeStyle(utils => ({
    paddigLeft: utils.spacings.sp12,
    paddingTop: utils.spacings.sp16,
    paddingRight: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp12,
}));

const buttonStyle = prepareNativeStyle(_ => ({
    alignSelf: 'flex-start',
}));

export const ReleaseNotesTabContent = () => {
    const openLink = useOpenLink();
    const { applyStyle } = useNativeStyles();

    const version = getSuiteVersion();

    const openMobileReleaseNotes = () => {
        openLink(`${GITHUB_REPO_URL}/releases#release-v${version}@mobile`);
    };

    return (
        <Box>
            <View style={applyStyle(headerCardStyle)}>
                <HStack spacing="sp6" alignItems="center">
                    <Text variant="body-sm" color="contentSecondary">
                        <Translation id="moduleActivityCenter.releaseNotes.version" />
                    </Text>
                    <Badge label={version} intent="neutral" size="small" />
                </HStack>
            </View>
            <Card style={applyStyle(mainCardStyle)}>
                <VStack spacing="sp12">
                    <MarkdownText markdown={releaseNotesMarkdown} />
                    <CardDivider />
                    <TextButton
                        priority="secondary"
                        size="small"
                        isUnderlined
                        iconRight="arrowLineUpRight"
                        style={applyStyle(buttonStyle)}
                        onPress={openMobileReleaseNotes}
                    >
                        <Translation id="moduleActivityCenter.releaseNotes.viewOnGithub" />
                    </TextButton>
                </VStack>
            </Card>
        </Box>
    );
};
