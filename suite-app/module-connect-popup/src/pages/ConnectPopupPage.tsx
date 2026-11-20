import { Column } from '@trezor/components';
import { useLayout } from '@trezor/suite';

export const ConnectPopupPage = () => {
    useLayout('Trezor Connect', null);

    // No content, this is handled by modals
    return (
        <Column data-testid="@connect-popup/index">
            <div />
        </Column>
    );
};
