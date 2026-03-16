import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { type GlobalSendReceiveType } from '@suite-common/wallet-types';
import { ButtonGroup, type ButtonProps } from '@trezor/components';

import { useAnalytics } from 'src/support/useAnalytics';

import { HeaderActionButton } from '../HeaderActionButton';

type GlobalSendReceiveButtonsProps = {
    setActiveModal: (activeModal: NonNullable<GlobalSendReceiveType>) => void;
    intent: NonNullable<ButtonProps['intent']>;
    priority: NonNullable<ButtonProps['priority']>;
};
export const GlobalSendReceiveButtons = ({
    setActiveModal,
    intent,
    priority,
}: GlobalSendReceiveButtonsProps) => {
    const analytics = useAnalytics();

    return (
        <ButtonGroup intent={intent} priority={priority}>
            <HeaderActionButton
                key="wallet-send"
                icon="arrowUp"
                onClick={() => {
                    setActiveModal('send');

                    analytics.report({ type: events.dashboardSendModalEvent.name });
                }}
                data-testid="@wallet/menu/wallet-global-send"
            >
                <Translation id="TR_NAV_SEND" />
            </HeaderActionButton>

            <HeaderActionButton
                key="wallet-receive"
                icon="arrowDown"
                onClick={() => {
                    setActiveModal('receive');

                    analytics.report({ type: events.dashboardReceiveModalEvent.name });
                }}
                data-testid="@wallet/menu/wallet-global-receive"
            >
                <Translation id="TR_NAV_RECEIVE" />
            </HeaderActionButton>
        </ButtonGroup>
    );
};
