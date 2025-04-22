import { formatAmount, getAccountDecimals } from '@suite-common/wallet-utils';
import { Column, H3, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { onCancel } from 'src/actions/suite/modalActions';
import { goto } from 'src/actions/suite/routerActions';
import { FormattedCryptoAmount, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { UNECONOMICAL_COINJOIN_THRESHOLD } from 'src/services/coinjoin';

export const UnecoCoinjoinModal = () => {
    const account = useSelector(selectSelectedAccount);
    const dispatch = useDispatch();

    if (!account) {
        return null;
    }

    const { symbol } = account;
    const decimals = getAccountDecimals(symbol) || 8;

    const handleContinue = () => {
        dispatch(onCancel());
        dispatch(goto('wallet-anonymize', { preserveParams: true }));
    };

    const handleCancel = () => {
        dispatch(onCancel());
    };

    return (
        <Modal
            onCancel={handleCancel}
            bottomContent={
                <>
                    <Modal.Button onClick={handleContinue}>
                        <Translation id="TR_UNECO_COINJOIN_AGREE" />
                    </Modal.Button>
                    <Modal.Button variant="tertiary" onClick={handleCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
            size="small"
            variant="warning"
            iconName="arrowsIn"
        >
            <Column gap={spacings.xs}>
                <H3>
                    <Translation id="TR_UNECO_COINJOIN_TITLE" />
                </H3>
                <Paragraph variant="tertiary">
                    <Translation
                        id="TR_UNECO_COINJOIN_EXPLANATION"
                        values={{
                            crypto: (
                                <FormattedCryptoAmount
                                    value={formatAmount(UNECONOMICAL_COINJOIN_THRESHOLD, decimals)}
                                    symbol={symbol}
                                    isRawString
                                />
                            ),
                            b: chunk => <strong>{chunk}</strong>,
                        }}
                    />
                </Paragraph>
            </Column>
        </Modal>
    );
};
