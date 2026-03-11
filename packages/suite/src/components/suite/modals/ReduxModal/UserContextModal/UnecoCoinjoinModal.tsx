import { Translation } from '@suite/intl';
import { closeModal } from '@suite/modal';
import { convertAmountSubunitsToUnits, getAccountDecimals } from '@suite-common/wallet-utils';
import { Column, H3, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useDispatch } from 'src/hooks/suite';
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
        dispatch(closeModal());
        dispatch(goto('wallet-anonymize', { preserveParams: true }));
    };

    const handleCancel = () => {
        dispatch(closeModal());
    };

    return (
        <Modal
            onCancel={handleCancel}
            bottomContent={
                <>
                    <Modal.Button onClick={handleContinue}>
                        <Translation id="TR_UNECO_COINJOIN_AGREE" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={handleCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
            width={600}
            intent="warning"
            iconName="arrowsIn"
        >
            <Column gap={spacings.xs}>
                <H3>
                    <Translation id="TR_UNECO_COINJOIN_TITLE" />
                </H3>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation
                        id="TR_UNECO_COINJOIN_EXPLANATION"
                        values={{
                            crypto: (
                                <FormattedCryptoAmount
                                    value={convertAmountSubunitsToUnits(
                                        UNECONOMICAL_COINJOIN_THRESHOLD,
                                        decimals,
                                    )}
                                    symbol={symbol}
                                    isRawString
                                    disableHiddenPlaceholder
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
