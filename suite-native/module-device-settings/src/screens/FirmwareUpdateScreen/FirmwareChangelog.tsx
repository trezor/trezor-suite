import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { BottomSheet, Button, Text } from '@suite-native/atoms';
import { selectFirmwareChangelog } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type FirmwareChangelogProps = {
    isVisible: boolean;
    onClose: () => void;
};

const changelogSectionTitleTextStyle = prepareNativeStyle(utils => ({
    ...utils.typography.highlight,
    paddingTop: utils.spacings.sp24,
}));

const buttonContainerStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.sp32,
}));

const ChangelogSectionTitle = ({ children }: { children: React.ReactNode }) => {
    const { applyStyle } = useNativeStyles();

    return <Text style={applyStyle(changelogSectionTitleTextStyle)}>{children}</Text>;
};

export const FirmwareChangelog = ({ isVisible, onClose }: FirmwareChangelogProps) => {
    const firmwareChangelog = useSelector(selectFirmwareChangelog);
    const { applyStyle } = useNativeStyles();

    const formattedChangelog = useMemo(() => {
        if (!firmwareChangelog) {
            return (
                <Text>
                    <Translation id="moduleDeviceSettings.firmware.firmwareUpdateScreen.changelog.changelogUnavailable" />
                </Text>
            );
        }

        let firmwareChangelogLines: string[] = [];
        if (typeof firmwareChangelog === 'string') {
            firmwareChangelogLines = firmwareChangelog.split('\n');
        } else {
            firmwareChangelogLines = firmwareChangelog;
        }

        return firmwareChangelogLines.map((text, index) => {
            const key = text + index;

            // Match any number of '#' at the start of the line followed by text
            if (/^#+\s*(.+)/.test(text)) {
                const strippedText = text.replace(/^#+\s*/, '').trim();

                return <ChangelogSectionTitle key={key}>{strippedText}</ChangelogSectionTitle>;
            }

            // Match common list item markers with optional spaces
            const listItemRegex = /^\s*[-+*]\s+(.+)/;
            if (listItemRegex.test(text)) {
                const formattedText = text.replace(listItemRegex, ' • $1');

                return <Text key={key}>{formattedText}</Text>;
            }

            return <Text key={key}>{text}</Text>;
        });
    }, [firmwareChangelog]);

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} isScrollable isCloseDisplayed={false}>
            <Text variant="titleSmall" color="textDefault">
                <Translation id="moduleDeviceSettings.firmware.firmwareUpdateScreen.changelog.title" />
            </Text>
            {formattedChangelog}
            <Button
                onPress={onClose}
                style={applyStyle(buttonContainerStyle)}
                colorScheme="tertiaryElevation0"
            >
                <Translation id="moduleDeviceSettings.firmware.firmwareUpdateScreen.changelog.closeButton" />
            </Button>
        </BottomSheet>
    );
};
