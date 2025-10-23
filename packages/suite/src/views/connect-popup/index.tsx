import { Column } from '@trezor/components';

import { useLayout } from 'src/hooks/suite';

export const ConnectPopup = () => {
    useLayout('Trezor Connect', null);

    // No content, this is handled by modals
    return (
        <Column data-testid="@connect-popup/index">
            <div />
        </Column>
    );
};
