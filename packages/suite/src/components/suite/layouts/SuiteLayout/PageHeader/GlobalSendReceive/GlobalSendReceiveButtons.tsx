import { NewButtonGroup, NewButtonProps } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { Translation } from '../../../../Translation';
import { HeaderActionButton } from '../HeaderActionButton';

type GlobalSendReceiveButtonsProps = {
    setIsSendModalOpen: (isSendModalOpen: boolean) => void;
    setIsReceiveModalOpen: (isReceiveModalOpen: boolean) => void;
    intent: NonNullable<NewButtonProps['intent']>;
    priority: NonNullable<NewButtonProps['priority']>;
};
export const GlobalSendReceiveButtons = ({
    setIsSendModalOpen,
    setIsReceiveModalOpen,
    intent,
    priority,
}: GlobalSendReceiveButtonsProps) => (
    <NewButtonGroup intent={intent} priority={priority}>
        <HeaderActionButton
            key="wallet-send"
            icon="arrowUp"
            onClick={() => {
                setIsSendModalOpen(true);

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
                setIsReceiveModalOpen(true);

                        analytics.report({ type: EventType.DashboardReceiveModal });
                    }}
                    data-testid="@wallet/menu/wallet-global-receive"
                >
                    <Translation id="TR_NAV_RECEIVE" />
                </HeaderActionButton>
            </NewButtonGroup>
    );
};
