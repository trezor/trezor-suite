import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectFirmwareChangelog } from '@suite-common/device';
import { BottomSheetModal, type BottomSheetModalRef, Button, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type FirmwareChangelogProps = {
    onClose: () => void;
    ref: BottomSheetModalRef;
};

const changelogSectionTitleTextStyle = prepareNativeStyle(utils => ({
    ...utils.typography['body-md-strong'],
    paddingTop: utils.spacings.sp24,
}));

const buttonContainerStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.sp32,
}));

const ChangelogSectionTitle = ({ children }: { children: React.ReactNode }) => {
    const { applyStyle } = useNativeStyles();

    return <Text style={applyStyle(changelogSectionTitleTextStyle)}>{children}</Text>;
};

export const FirmwareChangelog = ({ ref, onClose }: FirmwareChangelogProps) => {
    const firmwareChangelog = useSelector(selectFirmwareChangelog);
    const { applyStyle } = useNativeStyles();

    const formattedChangelog = useMemo(() => {
        if (!firmwareChangelog) {
            return (
                <Text>
                    <Translation id="firmware.changelog.changelogUnavailable" />
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
        <BottomSheetModal ref={ref}>
            <Text variant="headline-sm" color="contentPrimary">
                <Translation id="firmware.changelog.title" />
            </Text>
            {formattedChangelog}
            <Button
                onPress={onClose}
                style={applyStyle(buttonContainerStyle)}
                intent="neutral"
                priority="secondary"
            >
                <Translation id="generic.buttons.close" />
            </Button>
        </BottomSheetModal>
    );
};
