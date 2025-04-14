import {
    WelcomeLayoutWithoutModalSwitcher,
    WelcomeLayoutWithoutModalSwitcherProps,
} from './WelcomeLayoutWithoutModalSwitcher';
import { ModalSwitcher } from '../../modals/ModalSwitcher/ModalSwitcher';

export const WelcomeLayout = ({ children, ...rest }: WelcomeLayoutWithoutModalSwitcherProps) => (
    <WelcomeLayoutWithoutModalSwitcher {...rest}>
        <ModalSwitcher />
        {children}
    </WelcomeLayoutWithoutModalSwitcher>
);
