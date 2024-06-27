import { useLayout } from 'src/hooks/suite';
import { PasswordManager } from './PasswordManager/PasswordManager';

export default () => {
    useLayout('Password manager');
    return <PasswordManager />;
};
