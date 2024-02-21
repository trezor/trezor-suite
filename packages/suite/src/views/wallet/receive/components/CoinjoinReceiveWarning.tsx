import styled, { useTheme } from 'styled-components';
import { darken } from 'polished';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { Button, Icon, variables, Warning } from '@trezor/components';
import { hideCoinjoinReceiveWarning } from 'src/actions/suite/suiteActions';
import { formatAmount, getAccountDecimals } from '@suite-common/wallet-utils';
import { UNECONOMICAL_COINJOIN_THRESHOLD } from 'src/services/coinjoin';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { selectIsAccountWithRatesByKey } from '@suite-common/wallet-core';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

const StyledWarning = styled(Warning)`
    justify-content: space-between;
    margin-bottom: 16px;
    gap: 16px;

    ${variables.SCREEN_QUERY.MOBILE} {
        align-items: stretch;
        flex-direction: column;
    }
`;

const InfoIcon = styled(Icon)`
    width: 18px;
    height: 18px;
    margin-right: 6px;
    align-self: flex-start;
    background: ${({ theme }) => theme.TYPE_LIGHT_ORANGE};
    border-radius: 50%;

    ${variables.SCREEN_QUERY.MOBILE} {
        align-self: start;
    }
`;

const Text = styled.div`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Heading = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    color: ${({ theme }) => theme.TYPE_DARK_ORANGE};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
`;

const WarningList = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding-left: 16px;
`;

const StyledButton = styled(Button)`
    background: ${({ theme }) => theme.TYPE_DARK_ORANGE};

    :hover,
    :focus,
    :active {
        background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.TYPE_DARK_ORANGE)};
    }
`;

export const CoinjoinReceiveWarning = () => {
    const account = useSelector(selectSelectedAccount);
    const localCurrency = useSelector(selectLocalCurrency);
    const isAccountWithRate = useSelector(state =>
        selectIsAccountWithRatesByKey(state, account?.key || '', localCurrency),
    );

    const theme = useTheme();
    const dispatch = useDispatch();

    if (!account) {
        return null;
    }

    const { symbol } = account;
    const decimals = getAccountDecimals(symbol) || 8;

    return (
        <StyledWarning>
            <Text>
                <Heading>
                    <InfoIcon icon="INFO" size={14} color={theme.TYPE_DARK_ORANGE} />
                    <Translation id="TR_COINJOIN_RECEIVE_WARNING_TITLE" />
                </Heading>

                <WarningList>
                    <li>
                        <Translation id="TR_COINJOIN_CEX_WARNING" />
                    </li>

                    <li>
                        <Translation
                            id="TR_UNECO_COINJOIN_RECEIVE_WARNING"
                            values={{
                                crypto: (
                                    <FormattedCryptoAmount
                                        value={formatAmount(
                                            UNECONOMICAL_COINJOIN_THRESHOLD,
                                            decimals,
                                        )}
                                        symbol={symbol}
                                    />
                                ),
                                fiat: (
                                    <FiatValue
                                        amount={formatAmount(
                                            UNECONOMICAL_COINJOIN_THRESHOLD,
                                            decimals,
                                        )}
                                        symbol={symbol}
                                    />
                                ),
                                isAccountWithRate,
                            }}
                        />
                    </li>
                </WarningList>
            </Text>

            <StyledButton onClick={() => dispatch(hideCoinjoinReceiveWarning())}>
                <Translation id="TR_GOT_IT" />
            </StyledButton>
        </StyledWarning>
    );
};
