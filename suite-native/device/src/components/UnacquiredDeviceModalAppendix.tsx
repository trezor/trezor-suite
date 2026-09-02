import { BulletList, BulletListItem } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const UnacquiredDeviceModalAppendix = () => (
    <BulletList textColor="contentSecondary" spacing="sp8">
        <BulletListItem>
            <Translation id="moduleDevice.unacquiredDeviceModal.appendix.bullet1" />
        </BulletListItem>
        <BulletListItem>
            <Translation id="moduleDevice.unacquiredDeviceModal.appendix.bullet2" />
        </BulletListItem>
    </BulletList>
);
