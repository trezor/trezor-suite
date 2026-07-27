import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import { Banner, Paragraph, Text } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

export const FirmwareWipeWarning = () => {
    const warningTranslationValues: ExtendedMessageDescriptor['values'] = {
        b: chunks => <Text typographyStyle="body-sm-strong">{chunks}</Text>,
    };

    return (
        <Banner
            intent="critical"
            icon={WarningIcon}
            description={
                <Paragraph>
                    <Translation
                        id="TR_FIRMWARE_SWITCH_WARNING_1"
                        values={warningTranslationValues}
                    />{' '}
                    <Translation
                        id="TR_FIRMWARE_SWITCH_WARNING_2"
                        values={warningTranslationValues}
                    />
                </Paragraph>
            }
        />
    );
};
