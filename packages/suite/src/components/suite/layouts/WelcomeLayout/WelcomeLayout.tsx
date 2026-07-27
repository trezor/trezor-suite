import {
    WelcomeLayoutWithoutModalSwitcher,
    type WelcomeLayoutWithoutModalSwitcherProps,
} from './WelcomeLayoutWithoutModalSwitcher';
import { ModalSwitcher } from '../../modals/ModalSwitcher/ModalSwitcher';
import { AddPassphraseWalletFlow } from '../SuiteLayout/AddPassphraseWalletFlow';
import { SwitchDeviceLayer } from '../SuiteLayout/SwitchDeviceLayer';

export const WelcomeLayout = ({ children, ...rest }: WelcomeLayoutWithoutModalSwitcherProps) => (
    <WelcomeLayoutWithoutModalSwitcher {...rest}>
        <ModalSwitcher />
        <SwitchDeviceLayer />
        <AddPassphraseWalletFlow />
        {children}
    </WelcomeLayoutWithoutModalSwitcher>
);
