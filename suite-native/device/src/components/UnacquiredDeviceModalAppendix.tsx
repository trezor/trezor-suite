import { BulletListItem, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const UnacquiredDeviceModalAppendix = () => (
    <VStack>
        <BulletListItem color="contentSecondary">
            <Translation id="moduleDevice.unacquiredDeviceModal.appendix.bullet1" />
        </BulletListItem>
        <BulletListItem color="contentSecondary">
            <Translation id="moduleDevice.unacquiredDeviceModal.appendix.bullet2" />
        </BulletListItem>
    </VStack>
);
