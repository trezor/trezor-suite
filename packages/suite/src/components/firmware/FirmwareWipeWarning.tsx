import { Banner, Paragraph, Text } from '@trezor/components';

import { ExtendedMessageDescriptor, Translation } from 'src/components/suite/Translation';

export const FirmwareWipeWarning = () => {
    const warningTranslationValues: ExtendedMessageDescriptor['values'] = {
        b: chunks => <Text typographyStyle="callout">{chunks}</Text>,
    };

    return (
        <Banner intent="critical" icon="warning">
            <Paragraph>
                <Translation id="TR_FIRMWARE_SWITCH_WARNING_1" values={warningTranslationValues} />{' '}
                <Translation id="TR_FIRMWARE_SWITCH_WARNING_2" values={warningTranslationValues} />
            </Paragraph>
        </Banner>
    );
};
