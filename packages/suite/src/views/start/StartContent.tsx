import { Card } from '@trezor/components';

import { PrerequisitesGuide } from 'src/components/suite';

import { ModalSwitcher } from '../../components/suite/modals/ModalSwitcher/ModalSwitcher';

export const StartContent = () => (
    <Card>
        <ModalSwitcher />
        <PrerequisitesGuide />
    </Card>
);
