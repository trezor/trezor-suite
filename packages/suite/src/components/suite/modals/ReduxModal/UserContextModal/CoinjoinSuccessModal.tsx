import { Translation } from '@suite/intl';
import { closeModal } from '@suite/modal';
import { selectRouterParams } from '@suite/router';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey, WalletParams } from '@suite-common/wallet-types';
import { Column, H3, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';

type CoinjoinSuccessModalProps = {
    relatedAccountKey: AccountKey;
};

export const CoinjoinSuccessModal = ({ relatedAccountKey }: CoinjoinSuccessModalProps) => {
    const routerParams = useSelector(selectRouterParams);
    const relatedAccount = useSelector(state => selectAccountByKey(state, relatedAccountKey));

    const dispatch = useDispatch();

    if (!relatedAccount) {
        return null;
    }

    const { symbol, index, accountType } = relatedAccount;

    const close = () => dispatch(closeModal());
    const navigateToRelatedAccount = () => {
        dispatch(closeModal());
        dispatch(
            goto('wallet-index', {
                params: {
                    symbol,
                    accountIndex: index,
                    accountType,
                },
            }),
        );
    };

    const {
        symbol: symbolParam,
        accountIndex: indexParam,
        accountType: accountTypeParam,
    } = (routerParams as WalletParams) || {};

    const isOnAccountPage =
        symbolParam === symbol && indexParam === index && accountTypeParam === accountType;

    return (
        <Modal
            onCancel={close}
            bottomContent={
                <>
                    {!isOnAccountPage && (
                        <Modal.Button onClick={navigateToRelatedAccount}>
                            <Translation id="TR_VIEW_ACCOUNT" />
                        </Modal.Button>
                    )}
                    <Modal.Button intent="neutral" priority="secondary" onClick={close}>
                        <Translation id="TR_CLOSE" />
                    </Modal.Button>
                </>
            }
            width={600}
            iconName="arrowsIn"
        >
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_COINJOIN_COMPLETED" />
                </H3>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_COINJOIN_COMPLETED_DESCRIPTION" />
                </Paragraph>
            </Column>
        </Modal>
    );
};
