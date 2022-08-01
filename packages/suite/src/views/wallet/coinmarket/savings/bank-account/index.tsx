import * as React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { Button, Input, Select } from '@trezor/components';
import { InputError, KYCInProgress, withCoinmarket, WithCoinmarketProps } from '@wallet-components';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { useCoinmarketSavingsBankAccount } from '@wallet-hooks/useCoinmarketSavingsBankAccount';
import { Controller } from 'react-hook-form';
import { UsBankAccountTypes } from '@wallet-constants/coinmarket/savings';
import { buildUsBankAccountType } from '@wallet-utils/coinmarket/coinmarketUtils';

const Header = styled.div`
    font-size: 24px;
    line-height: 24px;
    margin-bottom: 31px;
`;

const BankAccountTypeNote = styled.div`
    font-size: 14px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-bottom: 27px;
`;

const BankAccount = (props: WithCoinmarketProps) => {
    const {
        register,
        errors,
        getValues,
        onSubmit,
        handleSubmit,
        formState,
        isWatchingKYCStatus,
        isSavingsTradeLoading,
        control,
    } = useCoinmarketSavingsBankAccount(props);

    if (isSavingsTradeLoading) {
        return <Translation id="TR_LOADING" />;
    }
    const typeSelectName = 'typeOption';
    const nameInputName = 'name';
    const routingNumberInputName = 'routingNumber';
    const accountNumberInputName = 'accountNumber';
    const bankAccountOwnerInputName = 'bankAccountOwner';
    const { isSubmitting } = formState;
    const { name, routingNumber, accountNumber, bankAccountOwner } = getValues();
    const canSubmit = Object.keys(errors).length === 0 && !isSubmitting;
    return (
        <>
            {isWatchingKYCStatus && <KYCInProgress />}
            <Header>
                <Translation id="TR_SAVINGS_BANK_ACCOUNT_HEADER" />
            </Header>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Controller
                    control={control}
                    name={typeSelectName}
                    defaultValue={buildUsBankAccountType(UsBankAccountTypes[0])}
                    render={({ onChange, value }) => (
                        <>
                            <Select
                                options={UsBankAccountTypes.map(buildUsBankAccountType)}
                                value={value}
                                isClearable={false}
                                hideTextCursor
                                label={<Translation id="TR_SAVINGS_BANK_ACCOUNT_TYPE_LABEL" />}
                                onChange={(selected: any) => {
                                    onChange(selected);
                                }}
                            />
                            <BankAccountTypeNote>
                                {value.value === UsBankAccountTypes[1] && (
                                    <Translation id="TR_SAVINGS_BANK_ACCOUNT_TYPE_NOTE" />
                                )}
                            </BankAccountTypeNote>
                        </>
                    )}
                />
                <Input
                    placeholder="Checking account"
                    label={<Translation id="TR_SAVINGS_BANK_ACCOUNT_NAME_LABEL" />}
                    name={nameInputName}
                    innerRef={register()}
                    inputState={getInputState(errors.name, name)}
                    bottomText={<InputError error={errors[nameInputName]} />}
                />
                <Input
                    label={<Translation id="TR_SAVINGS_BANK_ACCOUNT_ROUTING_NUMBER_LABEL" />}
                    name={routingNumberInputName}
                    inputState={getInputState(errors.routingNumber, routingNumber)}
                    innerRef={register({
                        required: 'TR_SAVINGS_BANK_ACCOUNT_ROUTING_NUMBER_REQUIRED',
                    })}
                    bottomText={<InputError error={errors[routingNumberInputName]} />}
                />
                <Input
                    label={<Translation id="TR_SAVINGS_BANK_ACCOUNT_ACCOUNT_NUMBER_LABEL" />}
                    name={accountNumberInputName}
                    inputState={getInputState(errors.accountNumber, accountNumber)}
                    innerRef={register({
                        required: 'TR_SAVINGS_BANK_ACCOUNT_ACCOUNT_NUMBER_REQUIRED',
                    })}
                    bottomText={<InputError error={errors[accountNumberInputName]} />}
                />
                <Input
                    label={<Translation id="TR_SAVINGS_BANK_ACCOUNT_OWNER_LABEL" />}
                    name={bankAccountOwnerInputName}
                    inputState={getInputState(errors.bankAccountOwner, bankAccountOwner)}
                    innerRef={register({
                        required: 'TR_SAVINGS_BANK_ACCOUNT_OWNER_REQUIRED',
                    })}
                    bottomText={<InputError error={errors[bankAccountOwnerInputName]} />}
                />
                <Button isDisabled={!canSubmit} isLoading={isSubmitting}>
                    <Translation id="TR_CONFIRM" />
                </Button>
            </form>
        </>
    );
};

export default withCoinmarket(BankAccount, {
    title: 'TR_NAV_INVITY',
});
