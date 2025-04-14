import { selectAccountByKey } from '@suite-common/wallet-core';
import { WalletParams } from '@suite-common/wallet-types';
import { Column, H3, NewModal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { onCancel as closeModal } from 'src/actions/suite/modalActions';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectRouterParams } from 'src/reducers/suite/routerReducer';

type CoinjoinSuccessModalProps = {
    relatedAccountKey: string;
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
        <NewModal
            onCancel={close}
            bottomContent={
                <>
                    {!isOnAccountPage && (
                        <NewModal.Button onClick={navigateToRelatedAccount}>
                            <Translation id="TR_VIEW_ACCOUNT" />
                        </NewModal.Button>
                    )}
                    <NewModal.Button variant="tertiary" onClick={close}>
                        <Translation id="TR_CLOSE" />
                    </NewModal.Button>
                </>
            }
            size="small"
            iconName="arrowsIn"
        >
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_COINJOIN_COMPLETED" />
                </H3>
                <Paragraph variant="tertiary">
                    <Translation id="TR_COINJOIN_COMPLETED_DESCRIPTION" />
                </Paragraph>
            </Column>
        </NewModal>
    );
};
