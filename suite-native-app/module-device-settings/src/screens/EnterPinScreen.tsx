import { DeviceInteractionScreenWrapper } from '@suite-native/device';
import { type PinFormVariant, PinOnKeypad } from '@suite-native/device-authorization';

type EnterPinScreenProps = {
    variant: PinFormVariant;
};

const EnterPinScreen = ({ variant }: EnterPinScreenProps) => (
    <DeviceInteractionScreenWrapper>
        <PinOnKeypad variant={variant} />
    </DeviceInteractionScreenWrapper>
);

export const EnterCurrentPinScreen = () => <EnterPinScreen variant="current" />;
export const EnterNewPinScreen = () => <EnterPinScreen variant="new" />;
export const ConfirmNewPinScreen = () => <EnterPinScreen variant="confirm" />;
