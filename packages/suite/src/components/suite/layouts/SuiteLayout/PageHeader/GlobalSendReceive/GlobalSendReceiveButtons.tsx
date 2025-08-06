import { ButtonGroup, ButtonVariant } from '@trezor/components';

import { Translation } from '../../../../Translation';
import { HeaderActionButton } from '../HeaderActionButton';

type GlobalSendReceiveButtonsProps = {
    setIsSendModalOpen: (isSendModalOpen: boolean) => void;
    setIsReceiveModalOpen: (isReceiveModalOpen: boolean) => void;
    variant: ButtonVariant;
};
export const GlobalSendReceiveButtons = ({
    setIsSendModalOpen,
    setIsReceiveModalOpen,
    variant,
}: GlobalSendReceiveButtonsProps) => (
    <ButtonGroup size="small">
        <HeaderActionButton
            key="wallet-send"
            icon="arrowUp"
            onClick={() => {
                setIsSendModalOpen(true);
            }}
            data-testid="@wallet/menu/wallet-global-send"
            variant={variant}
        >
            <Translation id="TR_NAV_SEND" />
        </HeaderActionButton>

        <HeaderActionButton
            key="wallet-receive"
            icon="arrowDown"
            onClick={() => {
                setIsReceiveModalOpen(true);
            }}
            data-testid="@wallet/menu/wallet-global-receive"
            variant={variant}
        >
            <Translation id="TR_NAV_RECEIVE" />
        </HeaderActionButton>
    </ButtonGroup>
);
