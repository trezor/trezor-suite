import { VStack, BulletListItem } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

export const UnacquiredDeviceModalAppendix = () => {
    const { translate } = useTranslate();

    return (
        <VStack>
            <BulletListItem color="textSubdued">
                {translate('moduleDevice.unacquiredDeviceModal.appendix.bullet1')}
            </BulletListItem>
            <BulletListItem color="textSubdued">
                {translate('moduleDevice.unacquiredDeviceModal.appendix.bullet2')}
            </BulletListItem>
        </VStack>
    );
};
