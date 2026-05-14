import {
    WelcomeLayoutWithoutModalSwitcher,
    type WelcomeLayoutWithoutModalSwitcherProps,
} from './WelcomeLayoutWithoutModalSwitcher';
import { ModalSwitcher } from '../../modals/ModalSwitcher/ModalSwitcher';
import { PassphraseFlow } from '../SuiteLayout/PassphraseFlow';

export const WelcomeLayout = ({ children, ...rest }: WelcomeLayoutWithoutModalSwitcherProps) => (
    <WelcomeLayoutWithoutModalSwitcher {...rest}>
        <ModalSwitcher />
        <PassphraseFlow />
        {children}
    </WelcomeLayoutWithoutModalSwitcher>
);
