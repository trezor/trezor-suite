import { AddPassphraseWalletFlow, SwitchDeviceLayer } from '@trezor/suite';

import {
    WelcomeLayoutWithoutModalSwitcher,
    type WelcomeLayoutWithoutModalSwitcherProps,
} from './WelcomeLayoutWithoutModalSwitcher';
import { ModalSwitcher } from '../ModalSwitcher/ModalSwitcher';

export const WelcomeLayout = ({ children, ...rest }: WelcomeLayoutWithoutModalSwitcherProps) => (
    <WelcomeLayoutWithoutModalSwitcher {...rest}>
        <ModalSwitcher />
        <SwitchDeviceLayer />
        <AddPassphraseWalletFlow />
        {children}
    </WelcomeLayoutWithoutModalSwitcher>
);
