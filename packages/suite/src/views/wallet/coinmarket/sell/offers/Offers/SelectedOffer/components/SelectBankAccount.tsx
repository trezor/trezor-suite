import { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { QuestionTooltip, Translation } from 'src/components/suite';
import { variables, Button, Select, Icon } from '@trezor/components';
import { useCoinmarketSellOffersContext } from 'src/hooks/wallet/useCoinmarketSellOffers';
import { BankAccount } from 'invity-api';
import { formatIban } from 'src/utils/wallet/coinmarket/sellUtils';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const CardContent = styled.div`
    display: flex;
    flex-direction: column;
    padding: 24px 24px;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledQuestionTooltip = styled(QuestionTooltip)`
    padding-left: 3px;
`;

const CustomLabel = styled(Label)`
    padding: 12px 0;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const LabelText = styled.div``;

const Option = styled.div`
    display: flex;
    align-items: center;
    padding: 0 0 0 5px;
    flex-direction: row;
    width: 100%;
`;

const AccountInfo = styled.div`
    display: flex;
    flex: 2;
    flex-direction: column;
`;

const AccountName = styled.div`
    display: flex;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const AccountNumber = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const AccountVerified = styled.div`
    display: flex;
    justify-content: flex-end;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

const AccountNotVerified = styled(AccountVerified)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin: 20px 0;
`;

const Row = styled.div`
    margin: 5px 0;
    display: flex;
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
    margin-right: 3px;
`;

export const SelectBankAccount = () => {
    const theme = useTheme();
    const { callInProgress, confirmTrade, addBankAccount, selectedQuote } =
        useCoinmarketSellOffersContext();
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
                    <Select
                        onChange={(selected: BankAccount) => {
                            setBankAccount(selected);
                        }}
                        value={bankAccount}
                        isClearable={false}
                        options={bankAccounts}
                        minWidth="70px"
                        formatOptionLabel={(option: BankAccount) => (
                            <Option>
                                <AccountInfo>
                                    <AccountName>{option.holder}</AccountName>
                                    <AccountNumber>{formatIban(option.bankAccount)}</AccountNumber>
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
