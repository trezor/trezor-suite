import { InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { HELP_CENTER_ADDRESSES_URL } from '@trezor/urls';

export const ReceiveAddressReuseWarning = () => (
    <InlineAlertBox
        intent="warning"
        marginBottom="sp8"
        title={
            <Translation
                id="moduleReceive.addressDetail.reuseWarning"
                values={{
                    link: chunk => (
                        <Link
                            label={chunk}
                            href={HELP_CENTER_ADDRESSES_URL}
                            isUnderlined
                            textVariant="body-sm"
                            textColor="contentWarning"
                            textPressedColor="contentWarningPressed"
                        />
                    ),
                }}
            />
        }
    />
);
