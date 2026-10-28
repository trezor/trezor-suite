import { Translation } from '@suite/intl';
import { type GlobalSendReceiveType } from '@suite-common/wallet-types';
import { ButtonGroup, type ButtonProps } from '@trezor/components';
import { ArrowDownIcon, ArrowUpIcon } from '@trezor/icons';

import { HeaderActionButton } from '../HeaderActionButton';

type GlobalSendReceiveButtonsProps = {
    onOpen: (modal: NonNullable<GlobalSendReceiveType>) => void;
    intent: NonNullable<ButtonProps['intent']>;
    priority: NonNullable<ButtonProps['priority']>;
};

export const GlobalSendReceiveButtons = ({
    onOpen,
    intent,
    priority,
}: GlobalSendReceiveButtonsProps) => (
    <ButtonGroup intent={intent} priority={priority}>
        <HeaderActionButton
            key="wallet-receive"
            icon={ArrowDownIcon}
            onClick={() => onOpen('receive')}
            data-testid="@wallet/menu/wallet-global-receive"
        >
            <Translation id="TR_NAV_RECEIVE" />
        </HeaderActionButton>

        <HeaderActionButton
            key="wallet-send"
            icon={ArrowUpIcon}
            onClick={() => onOpen('send')}
            data-testid="@wallet/menu/wallet-global-send"
        >
            <Translation id="TR_NAV_SEND" />
        </HeaderActionButton>
    </ButtonGroup>
);
