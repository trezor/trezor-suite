import { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { QuestionTooltip, Translation } from 'src/components/suite';
import { Button, Select, Icon } from '@trezor/components';
import { BankAccount } from 'invity-api';
import { formatIban } from 'src/utils/wallet/coinmarket/sellUtils';
import { CoinmarketTradeSellType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { fontWeights, spacingsPx, typography } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: ${spacingsPx.xs};
`;

const CardContent = styled.div`
    display: flex;
    flex-direction: column;
    padding: ${spacingsPx.xl};
`;

const Label = styled.div`
    display: flex;
    align-items: center;
    font-weight: ${fontWeights.medium};
`;

const StyledQuestionTooltip = styled(QuestionTooltip)`
    padding-left: ${spacingsPx.xxxs};
`;

const CustomLabel = styled(Label)`
    padding: ${spacingsPx.sm} 0;
    color: ${({ theme }) => theme.textSubdued};
`;

const LabelText = styled.div``;

const SelectWrapper = styled.div`
    width: 100%;

    /* stylelint-disable selector-class-pattern */
    .react-select__single-value {
        width: 100%;
    }
`;

const Option = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0 0 0 ${spacingsPx.xxs};
    width: 100%;
`;

const AccountInfo = styled.div`
    display: flex;
    flex-direction: column;
    flex: 2;
`;

const AccountName = styled.div`
    display: flex;
    color: ${({ theme }) => theme.textSubdued};
`;

const AccountNumber = styled.div`
    display: flex;
    font-weight: ${fontWeights.medium};
`;

const AccountVerified = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    ${typography.label}
    color: ${({ theme }) => theme.textPrimaryDefault};
`;

const AccountNotVerified = styled(AccountVerified)`
    color: ${({ theme }) => theme.textSubdued};
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: ${spacingsPx.lg};
    border-top: 1px solid ${({ theme }) => theme.borderElevation1};
    margin: ${spacingsPx.lg} 0;
`;

const Row = styled.div`
    margin: ${spacingsPx.xxs} 0;
    display: flex;

    .react-select__value-container {
        padding-right: ${spacingsPx.lg};
    }
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-start;
    flex-wrap: wrap;
`;

const Right = styled.div`
    display: flex;
`;

const RegisterAnother = styled(Button)`
    align-self: center;
`;

const StyledButton = styled(Button)`
    display: flex;
    min-width: 200px;
`;

const StyledIcon = styled(Icon)`
    margin-right: ${spacingsPx.xxxs};
`;

const CoinmarketSelectedOfferSellBankAccount = () => {
    const theme = useTheme();
    const { callInProgress, confirmTrade, addBankAccount, selectedQuote } =
        useCoinmarketFormContext<CoinmarketTradeSellType>();
    const [bankAccount, setBankAccount] = useState<BankAccount | undefined>(
        selectedQuote?.bankAccounts ? selectedQuote?.bankAccounts[0] : undefined,
    );

    if (!selectedQuote || !selectedQuote.bankAccounts) return null;

    const { bankAccounts } = selectedQuote;

    return (
        <Wrapper>
            <CardContent>
                <Row>
                    <Left>
                        <CustomLabel>
                            <LabelText>
                                <Translation id="TR_SELL_BANK_ACCOUNT" />
                            </LabelText>
                            <StyledQuestionTooltip tooltip="TR_SELL_BANK_ACCOUNT_TOOLTIP" />
                        </CustomLabel>
                    </Left>
                    <Right>
                        <RegisterAnother
                            variant="tertiary"
                            icon="PLUS"
                            data-test="add-output"
                            onClick={addBankAccount}
                        >
                            <Translation id="TR_SELL_ADD_BANK_ACCOUNT" />
                        </RegisterAnother>
                    </Right>
                </Row>
                <Row>
                    <SelectWrapper>
                        <Select
                            onChange={(selected: BankAccount) => {
                                setBankAccount(selected);
                            }}
                            value={bankAccount}
                            isClearable={false}
                            options={bankAccounts}
                            minValueWidth="70px"
                            formatOptionLabel={(option: BankAccount) => (
                                <Option>
                                    <AccountInfo>
                                        <AccountName>{option.holder}</AccountName>
                                        <AccountNumber>
                                            {formatIban(option.bankAccount)}
                                        </AccountNumber>
                                    </AccountInfo>
                                    {option.verified ? (
                                        <AccountVerified>
                                            <StyledIcon
                                                color={theme.TYPE_GREEN}
                                                size={15}
                                                icon="CHECK"
                                            />
                                            <Translation id="TR_SELL_BANK_ACCOUNT_VERIFIED" />
                                        </AccountVerified>
                                    ) : (
                                        <AccountNotVerified>
                                            <Translation id="TR_SELL_BANK_ACCOUNT_NOT_VERIFIED" />
                                        </AccountNotVerified>
                                    )}
                                </Option>
                            )}
                            isDisabled={bankAccounts.length < 2}
                        />
                    </SelectWrapper>
                </Row>
            </CardContent>
            <ButtonWrapper>
                <StyledButton
                    isLoading={callInProgress}
                    onClick={() => {
                        if (bankAccount) confirmTrade(bankAccount);
                    }}
                    isDisabled={callInProgress || !bankAccount}
                >
                    <Translation id="TR_SELL_GO_TO_TRANSACTION" />
                </StyledButton>
            </ButtonWrapper>
        </Wrapper>
    );
};

export default CoinmarketSelectedOfferSellBankAccount;
