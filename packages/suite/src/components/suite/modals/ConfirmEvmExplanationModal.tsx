import { Translation, type TranslationKey } from '@suite/intl';
import { closeModal } from '@suite/modal';
import { networks } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Column, H2, Modal, Paragraph } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { confirmEvmExplanationModal } from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

export interface ConfirmNetworkExplanationModalProps {
    account: Account | undefined;
    route: 'wallet-receive' | 'wallet-send';
}

export const ConfirmEvmExplanationModal = ({
    account,
    route,
}: ConfirmNetworkExplanationModalProps) => {
    const dispatch = useDispatch();
    const close = () => {
        dispatch(closeModal());
        if (!account?.symbol) {
            return;
        }
        dispatch(confirmEvmExplanationModal({ symbol: account.symbol, route }));
    };
    const confirmExplanationModalClosed = useSelector(
        state => state.suite.evmSettings.confirmExplanationModalClosed,
    );

    if (!account) {
        return null;
    }

    const network = networks[account.symbol];
    const isVisible =
        account.empty &&
        network.networkType === 'ethereum' &&
        !confirmExplanationModalClosed[account.symbol]?.[route];

    if (!isVisible) {
        return null;
    }

    const titleTranslationsIds: Record<typeof route, TranslationKey> = {
        'wallet-receive': 'TR_CONFIRM_EVM_EXPLANATION_RECEIVE_TITLE',
        'wallet-send': 'TR_CONFIRM_EVM_EXPLANATION_SEND_TITLE',
    };

    const descriptionTranslationsIds: Record<typeof route, TranslationKey> = {
        'wallet-receive':
            account.symbol === 'eth'
                ? 'TR_CONFIRM_EVM_EXPLANATION_RECEIVE_DESCRIPTION_ETH'
                : 'TR_CONFIRM_EVM_EXPLANATION_RECEIVE_DESCRIPTION_OTHER',
        'wallet-send': 'TR_CONFIRM_EVM_EXPLANATION_SEND_DESCRIPTION',
    };

    return (
        <Modal
            bottomContent={
                <Modal.Button onClick={close}>
                    <Translation id="TR_GOT_IT_BUTTON" />
                </Modal.Button>
            }
            width={600}
            icon={WarningIcon}
            intent="warning"
        >
            <Column gap={8}>
                <H2 typographyStyle="headline-sm">
                    <Translation
                        id={titleTranslationsIds[route]}
                        values={{
                            network: network.name,
                        }}
                    />
                </H2>
                <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation
                        id={descriptionTranslationsIds[route]}
                        values={{
                            network: network.name,
                        }}
                    />
                </Paragraph>
            </Column>
        </Modal>
    );
};
