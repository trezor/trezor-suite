import { useState } from 'react';

import { type BankAccount } from 'invity-api';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import {
    selectTradingSellIsLoading,
    selectTradingSellSelectedQuote,
    sellUtils,
} from '@suite-common/trading';
import { Button, Column, Divider, Icon, Row, Select, Text } from '@trezor/components';
import { CheckIcon, PlusIcon } from '@trezor/icons';

import { QuestionTooltip } from 'src/components/suite';
import { useTradingSellTradeActions } from 'src/hooks/wallet/trading/useTradingSellTradeActions';

const SelectWrapper = styled.div`
    width: 100%;

    /* stylelint-disable selector-class-pattern */
    .react-select__single-value {
        width: 100%;
    }

    .react-select__value-container {
        padding-right: 20px;
    }
`;

export const TradingOfferSellBankAccount = () => {
    const { confirmTrade, addBankAccount } = useTradingSellTradeActions();
    const isLoading = useSelector(selectTradingSellIsLoading);
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const [bankAccount, setBankAccount] = useState<BankAccount | undefined>(
        selectedQuote?.bankAccounts ? selectedQuote?.bankAccounts[0] : undefined,
    );

    if (!selectedQuote?.bankAccounts) return null;

    const { bankAccounts } = selectedQuote;

    return (
        <Column margin={{ top: 8 }}>
            <Column padding={24}>
                <Row margin={{ vertical: 4 }}>
                    <Row flex="1" flexWrap="wrap">
                        <Row alignItems="center" gap={2} padding={{ vertical: 12 }}>
                            <Text typographyStyle="body-md" color="contentSecondary">
                                <Translation id="TR_SELL_BANK_ACCOUNT" />
                            </Text>
                            <QuestionTooltip tooltip="TR_SELL_BANK_ACCOUNT_TOOLTIP" />
                        </Row>
                    </Row>
                    <Row alignItems="center">
                        <Button
                            intent="neutral"
                            priority="secondary"
                            iconLeft={PlusIcon}
                            data-testid="add-output"
                            onClick={addBankAccount}
                        >
                            <Translation id="TR_SELL_ADD_BANK_ACCOUNT" />
                        </Button>
                    </Row>
                </Row>
                <Row margin={{ vertical: 4 }}>
                    <SelectWrapper>
                        <Select
                            onChange={(selected: BankAccount) => {
                                setBankAccount(selected);
                            }}
                            value={bankAccount}
                            isClearable={false}
                            options={bankAccounts}
                            minValueWidth={70}
                            formatOptionLabel={(option: BankAccount) => (
                                <Row alignItems="center" padding={{ left: 4 }} width="100%">
                                    <Column flex="2">
                                        <Text typographyStyle="body-md" color="contentSecondary">
                                            {option.holder}
                                        </Text>
                                        <Text typographyStyle="body-md">
                                            {sellUtils.formatIban(option.bankAccount)}
                                        </Text>
                                    </Column>
                                    {option.verified ? (
                                        <Row alignItems="center" justifyContent="flex-end" gap={2}>
                                            <Icon intent="brand" size={15} as={CheckIcon} />
                                            <Text typographyStyle="body-xs" color="contentBrand">
                                                <Translation id="TR_SELL_BANK_ACCOUNT_VERIFIED" />
                                            </Text>
                                        </Row>
                                    ) : (
                                        <Row justifyContent="flex-end">
                                            <Text
                                                typographyStyle="body-xs"
                                                color="contentSecondary"
                                            >
                                                <Translation id="TR_SELL_BANK_ACCOUNT_NOT_VERIFIED" />
                                            </Text>
                                        </Row>
                                    )}
                                </Row>
                            )}
                            isDisabled={bankAccounts.length < 2}
                        />
                    </SelectWrapper>
                </Row>
            </Column>
            <Divider margin={{ top: 20 }} />
            <Column alignItems="center" margin={{ vertical: 20 }}>
                <Button
                    minWidth={200}
                    isLoading={isLoading}
                    onClick={() => {
                        if (bankAccount) confirmTrade(bankAccount);
                    }}
                    isDisabled={isLoading || !bankAccount}
                >
                    <Translation id="TR_SELL_GO_TO_TRANSACTION" />
                </Button>
            </Column>
        </Column>
    );
};
