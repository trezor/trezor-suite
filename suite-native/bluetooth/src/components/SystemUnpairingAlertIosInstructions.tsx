import { IconList, IconListTextItem } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const SystemUnpairingAlertIosInstructions = () => (
    <IconList textVariant="body-md">
        <IconListTextItem icon={1}>
            <Translation id="bluetooth.alerts.unpairingInstructions.step1" />
        </IconListTextItem>
        <IconListTextItem icon={2}>
            <Translation id="bluetooth.alerts.unpairingInstructions.step2" />
        </IconListTextItem>
        <IconListTextItem icon={3}>
            <Translation id="bluetooth.alerts.unpairingInstructions.step3" />
        </IconListTextItem>
    </IconList>
);
