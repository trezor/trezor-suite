import { VStack, BulletListItem } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const UnacquiredDeviceModalAppendix = () => {
    return (
        <VStack>
            <BulletListItem color="textSubdued">
                <Translation id="moduleDevice.unacquiredDeviceModal.appendix.bullet1" />
            </BulletListItem>
            <BulletListItem color="textSubdued">
                <Translation id="moduleDevice.unacquiredDeviceModal.appendix.bullet2" />
            </BulletListItem>
        </VStack>
    );
};
