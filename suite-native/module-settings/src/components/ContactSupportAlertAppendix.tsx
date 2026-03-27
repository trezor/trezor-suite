import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { selectSupportChatUrl } from '@suite-common/support';
import { CheckBox, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const checkboxRowStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    borderRadius: utils.borders.radii.r12,
    padding: utils.spacings.sp12,
}));

export type ContactSupportAlertAppendixRef = {
    getSupportChatUrl: () => string;
};

export const ContactSupportAlertAppendix = forwardRef<ContactSupportAlertAppendixRef>((_, ref) => {
    const [isChecked, setIsChecked] = useState(false);
    const supportChatUrl = useSelector((state: DeviceRootState) =>
        selectSupportChatUrl(state, isChecked),
    );
    const { applyStyle } = useNativeStyles();

    const supportChatUrlRef = useRef(supportChatUrl);
    supportChatUrlRef.current = supportChatUrl;

    useImperativeHandle(ref, () => ({ getSupportChatUrl: () => supportChatUrlRef.current }), []);

    return (
        <VStack spacing="sp12">
            <HStack spacing="sp12" alignItems="center" style={applyStyle(checkboxRowStyle)}>
                <CheckBox
                    isChecked={isChecked}
                    onChange={setIsChecked}
                    testID="@contact-support-alert/share-info-switch"
                />
                <Text variant="body-md-strong" style={{ flex: 1 }}>
                    <Translation id="moduleSettings.faq.needHelp.contactSupportAlert.toggleLabel" />
                </Text>
            </HStack>
            <Text color="textSubdued">
                <Translation id="moduleSettings.faq.needHelp.contactSupportAlert.description" />
            </Text>
        </VStack>
    );
});
