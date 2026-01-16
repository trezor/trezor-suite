import { Translation } from '@suite/intl';
import { GlobalSendReceiveType } from '@suite-common/wallet-types';
import { ButtonGroup, ButtonProps } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

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
}: GlobalSendReceiveButtonsProps) => (
    <ButtonGroup intent={intent} priority={priority}>
        <HeaderActionButton
            key="wallet-send"
            icon="arrowUp"
            onClick={() => {
                setActiveModal('send');

                analytics.report({ type: EventType.DashboardSendModal });
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

                analytics.report({ type: EventType.DashboardReceiveModal });
            }}
            data-testid="@wallet/menu/wallet-global-receive"
        >
            <Translation id="TR_NAV_RECEIVE" />
        </HeaderActionButton>
    </ButtonGroup>
);
