import { PinFormVariant, PinOnKeypad } from '@suite-native/device-authorization';

import { DeviceInteractionScreenWrapper } from '../components/DeviceInteractionScreenWrapper';

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
