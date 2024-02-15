import styled from 'styled-components';
import { transparentize } from 'polished';

import { selectIsAccountWithRatesByKey } from '@suite-common/wallet-core';
import { Button, variables } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, Modal, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { onCancel } from 'src/actions/suite/modalActions';
import { goto } from 'src/actions/suite/routerActions';
import { formatAmount, getAccountDecimals } from '@suite-common/wallet-utils';
import { UNECONOMICAL_COINJOIN_THRESHOLD } from 'src/services/coinjoin';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from 'src/hooks/suite/useSelector';

const StyledModal = styled(Modal)`
    width: 500px;

    ${Modal.BottomBar} {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }
`;

const Text = styled.div`
    text-align: start;
`;

const Message = styled.p`
    margin-bottom: 12px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Explanation = styled.i`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const AgreeButton = styled(Button)`
    background: ${({ theme }) => theme.TYPE_DARK_ORANGE};

    :hover {
        background: ${({ theme }) => transparentize(0.2, theme.TYPE_DARK_ORANGE)};
    }
`;

export const UnecoCoinjoinModal = () => {
    const account = useSelector(selectSelectedAccount);
    const localCurrency = useSelector(state => state.wallet.settings.localCurrency);
    const isAccountWithRate = useSelector(state =>
        selectIsAccountWithRatesByKey(state, account?.key || '', localCurrency),
    );

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

    return (
        <StyledModal
            isCancelable
            onCancel={() => dispatch(onCancel())}
            heading={<Translation id="TR_UNECO_COINJOIN_TITLE" />}
            bottomBarComponents={
                <>
                    <Button variant="secondary" onClick={() => dispatch(onCancel())}>
                        <Translation id="TR_CANCEL" />
                    </Button>

                    <AgreeButton onClick={handleContinue}>
                        <Translation id="TR_UNECO_COINJOIN_AGREE" />
                    </AgreeButton>
                </>
            }
        >
            <Text>
                <Message>
                    <Translation
                        id="TR_UNECO_COINJOIN_WARNING"
                        values={{
                            crypto: (
                                <FormattedCryptoAmount
                                    value={formatAmount(UNECONOMICAL_COINJOIN_THRESHOLD, decimals)}
                                    symbol={symbol}
                                />
                            ),
                            fiat: (
                                <FiatValue
                                    amount={formatAmount(UNECONOMICAL_COINJOIN_THRESHOLD, decimals)}
                                    symbol={symbol}
                                />
                            ),
                            isAccountWithRate,
                        }}
                    />
                </Message>

                <Explanation>
                    <Translation
                        id="TR_UNECO_COINJOIN_EXPLANATION"
                        values={{
                            crypto: (
                                <FormattedCryptoAmount
                                    value={formatAmount(UNECONOMICAL_COINJOIN_THRESHOLD, decimals)}
                                    symbol={symbol}
                                />
                            ),
                            b: chunk => <b>{chunk}</b>,
                        }}
                    />
                </Explanation>
            </Text>
        </StyledModal>
    );
};
