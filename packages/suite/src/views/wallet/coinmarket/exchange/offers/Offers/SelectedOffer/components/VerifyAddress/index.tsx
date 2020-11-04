import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';
import {
    FiatValue,
    QuestionTooltip,
    Translation,
    HiddenPlaceholder,
    AccountLabeling,
} from '@suite-components';
import {
    Input,
    variables,
    CoinLogo,
    DeviceImage,
    Select,
    Icon,
    Button,
    useTheme,
} from '@trezor/components';
import { InputError } from '@wallet-components';
import { useCoinmarketExchangeOffersContext } from '@wallet-hooks/useCoinmarketExchangeOffers';
import { Account } from '@wallet-types';
import * as modalActions from '@suite-actions/modalActions';
import { useDispatch } from 'react-redux';
import { Dispatch } from '@suite-types';
import useTimeoutFn from 'react-use/lib/useTimeoutFn';
import { useForm } from 'react-hook-form';
import { TypedValidationRules } from '@wallet-types/form';
import addressValidator from 'trezor-address-validator';
import { isHexValid, isInteger } from '@wallet-utils/validation';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const Heading = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    padding: 16px 24px 0 24px;
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const CardContent = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 24px 0 24px;
`;

const LogoWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: 0 0 0 3px;
`;

const AccountWrapper = styled.div`
    display: flex;
    padding: 0 0 0 15px;
    flex-direction: column;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledQuestionTooltip = styled(QuestionTooltip)`
    padding-left: 3px;
`;

const UpperCase = styled.div`
    text-transform: uppercase;
    padding: 0 3px;
`;

const FiatWrapper = styled.div`
    padding: 0 0 0 3px;
`;

const CustomLabel = styled(Label)`
    padding: 12px 0;
`;

const LabelText = styled.div``;

const StyledDeviceImage = styled(DeviceImage)`
    padding: 0 10px 0 0;
`;

const Amount = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const AccountName = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    margin: 20px 0;
`;

const Confirmed = styled.div`
    display: flex;
    height: 60px;
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    background: ${props => props.theme.BG_GREY};
    align-items: center;
    justify-content: center;
`;

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const AccountType = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    padding-left: 5px;
`;

const Row = styled.div`
    margin: 12px 0;
`;

type AccountSelectOption = {
    type: 'SUITE' | 'ADD_SUITE' | 'NON_SUITE';
    account?: Account;
};

type FormState = {
    address?: string;
    extraField?: string;
};

const VerifyAddressComponent = () => {
    const theme = useTheme();
    const {
        device,
        verifyAddress,
        confirmTrade,
        selectedQuote,
        addressVerified,
        suiteReceiveAccounts,
        receiveSymbol,
        setReceiveAccount,
    } = useCoinmarketExchangeOffersContext();
    const [selectedAccountOption, setSelectedAccountOption] = useState<AccountSelectOption>();
    const [menuIsOpen, setMenuIsOpen] = useState<boolean | undefined>(undefined);
    const dispatch = useDispatch<Dispatch>();
    const { register, watch, errors, setValue, formState } = useForm<FormState>({
        mode: 'onChange',
    });

    const typedRegister: (rules?: TypedValidationRules) => (ref: any) => void = useCallback(
        <T,>(rules?: T) => register(rules),
        [register],
    );

    const selectAccountOptions: AccountSelectOption[] = [];

    if (suiteReceiveAccounts) {
        suiteReceiveAccounts.forEach(account => {
            selectAccountOptions.push({ type: 'SUITE', account });
        });
        selectAccountOptions.push({ type: 'ADD_SUITE' });
    }
    selectAccountOptions.push({ type: 'NON_SUITE' });

    const selectAccountOption = (option: AccountSelectOption) => {
        setSelectedAccountOption(option);
        setReceiveAccount(option.account);
        if (option.account) {
            const { address } = getUnusedAddressFromAccount(option.account);
            setValue('address', address, { shouldValidate: true });
        }
    };

    const onChangeAccount = (account: AccountSelectOption) => {
        if (account.type === 'ADD_SUITE') {
            if (device) {
                setMenuIsOpen(true);
                dispatch(
                    modalActions.openModal({
                        type: 'add-account',
                        device: device!,
                        symbol: receiveSymbol as Account['symbol'],
                        noRedirect: true,
                    }),
                );
            }
        } else {
            selectAccountOption(account);
            setMenuIsOpen(undefined);
        }
    };

    // preselect the account after everything is loaded
    useTimeoutFn(() => {
        if (selectAccountOptions.length > 0 && selectAccountOptions[0].type !== 'ADD_SUITE') {
            selectAccountOption(selectAccountOptions[0]);
        }
    }, 100);

    const { address, extraField } = watch();

    const extraFieldDescription = selectedQuote?.extraFieldDescription
        ? {
              extraFieldName: selectedQuote?.extraFieldDescription?.name,
              extraFieldDescription: selectedQuote?.extraFieldDescription?.description,
              toCurrency: selectedQuote?.receive,
          }
        : {};

    return (
        <Wrapper>
            <Heading>
                <Translation
                    id="TR_EXCHANGE_RECEIVING_ADDRESS_INFO"
                    values={{ symbol: selectedQuote?.receive }}
                />
            </Heading>
            <CardContent>
                <Row>
                    <CustomLabel>
                        <LabelText>
                            <Translation id="TR_EXCHANGE_RECEIVING_ACCOUNT" />
                        </LabelText>
                        <StyledQuestionTooltip tooltip="TR_EXCHANGE_RECEIVE_ACCOUNT_QUESTION_TOOLTIP" />
                    </CustomLabel>
                    <Select
                        onChange={(selected: any) => {
                            onChangeAccount(selected);
                        }}
                        noTopLabel
                        value={selectedAccountOption}
                        isClearable={false}
                        options={selectAccountOptions}
                        minWidth="70px"
                        formatOptionLabel={(option: AccountSelectOption) => {
                            switch (option.type) {
                                case 'SUITE': {
                                    if (!option.account) return null;
                                    const { symbol, formattedBalance } = option.account;
                                    return (
                                        <Option>
                                            <LogoWrapper>
                                                <CoinLogo size={25} symbol={symbol} />
                                            </LogoWrapper>
                                            <AccountWrapper>
                                                <AccountName>
                                                    <AccountLabeling account={option.account} />
                                                    <AccountType>
                                                        {option.account.accountType !== 'normal'
                                                            ? option.account.accountType
                                                            : ''}
                                                    </AccountType>
                                                </AccountName>
                                                <Amount>
                                                    <HiddenPlaceholder>
                                                        {formattedBalance}
                                                    </HiddenPlaceholder>{' '}
                                                    <UpperCase>{symbol}</UpperCase> •
                                                    <FiatWrapper>
                                                        <FiatValue
                                                            amount={formattedBalance}
                                                            symbol={symbol}
                                                        />
                                                    </FiatWrapper>
                                                </Amount>
                                            </AccountWrapper>
                                        </Option>
                                    );
                                }
                                case 'ADD_SUITE':
                                    return (
                                        <Option>
                                            <LogoWrapper>
                                                <Icon
                                                    icon="PLUS"
                                                    size={25}
                                                    color={theme.TYPE_DARK_GREY}
                                                />
                                            </LogoWrapper>
                                            <AccountWrapper>
                                                <Translation
                                                    id="TR_EXCHANGE_CREATE_SUITE_ACCOUNT"
                                                    values={{
                                                        symbol: receiveSymbol?.toUpperCase(),
                                                    }}
                                                />
                                            </AccountWrapper>
                                        </Option>
                                    );
                                case 'NON_SUITE':
                                    return (
                                        <Option>
                                            <LogoWrapper>
                                                <Icon
                                                    icon="NON_SUITE"
                                                    size={25}
                                                    color={theme.TYPE_DARK_GREY}
                                                />
                                            </LogoWrapper>
                                            <AccountWrapper>
                                                <Translation
                                                    id="TR_EXCHANGE_USE_NON_SUITE_ACCOUNT"
                                                    values={{
                                                        symbol: receiveSymbol?.toUpperCase(),
                                                    }}
                                                />
                                            </AccountWrapper>
                                        </Option>
                                    );
                                default:
                                    return null;
                            }
                        }}
                        isDropdownVisible={selectAccountOptions.length === 1}
                        isDisabled={selectAccountOptions.length === 1}
                        placeholder={
                            <Translation
                                id="TR_EXCHANGE_SELECT_RECEIVE_ACCOUNT"
                                values={{ symbol: receiveSymbol?.toUpperCase() }}
                            />
                        }
                        menuIsOpen={menuIsOpen}
                    />
                </Row>
                <Row>
                    <Input
                        label={
                            <Label>
                                <Translation id="TR_EXCHANGE_RECEIVING_ADDRESS" />
                                <StyledQuestionTooltip tooltip="TR_EXCHANGE_RECEIVE_ADDRESS_QUESTION_TOOLTIP" />
                            </Label>
                        }
                        variant="small"
                        name="address"
                        innerRef={typedRegister({
                            required: 'TR_EXCHANGE_RECEIVING_ADDRESS_REQUIRED',
                            validate: value => {
                                if (selectedAccountOption?.type === 'NON_SUITE' && receiveSymbol) {
                                    if (!addressValidator.validate(value, receiveSymbol)) {
                                        return 'TR_EXCHANGE_RECEIVING_ADDRESS_INVALID';
                                    }
                                }
                            },
                        })}
                        readOnly={selectedAccountOption?.type !== 'NON_SUITE'}
                        state={errors.address ? 'error' : undefined}
                        bottomText={<InputError error={errors.address} />}
                    />

                    {addressVerified && addressVerified === address && (
                        <Confirmed>
                            {device && (
                                <StyledDeviceImage
                                    height={25}
                                    trezorModel={device.features?.major_version === 1 ? 1 : 2}
                                />
                            )}
                            <Translation id="TR_EXCHANGE_CONFIRMED_ON_TREZOR" />
                        </Confirmed>
                    )}
                </Row>
                {selectedQuote?.extraFieldDescription && (
                    <Row>
                        <Input
                            variant="small"
                            label={
                                <Label>
                                    <Translation
                                        id="TR_EXCHANGE_EXTRA_FIELD"
                                        values={extraFieldDescription}
                                    />
                                    <StyledQuestionTooltip
                                        tooltip={
                                            <Translation
                                                id="TR_EXCHANGE_EXTRA_FIELD_QUESTION_TOOLTIP"
                                                values={extraFieldDescription}
                                            />
                                        }
                                    />
                                </Label>
                            }
                            name="extraField"
                            innerRef={typedRegister({
                                required: selectedQuote?.extraFieldDescription?.required ? (
                                    <Translation
                                        id="TR_EXCHANGE_EXTRA_FIELD_REQUIRED"
                                        values={extraFieldDescription}
                                    />
                                ) : undefined,
                                validate: value => {
                                    let valid = true;
                                    if (value) {
                                        if (selectedQuote?.extraFieldDescription?.type === 'hex') {
                                            valid = isHexValid(value);
                                        } else if (
                                            selectedQuote?.extraFieldDescription?.type === 'number'
                                        ) {
                                            valid = isInteger(value);
                                        }
                                    }
                                    if (!valid) {
                                        return (
                                            <Translation
                                                id="TR_EXCHANGE_EXTRA_FIELD_INVALID"
                                                values={extraFieldDescription}
                                            />
                                        );
                                    }
                                },
                            })}
                            state={errors.extraField ? 'error' : undefined}
                            bottomText={<InputError error={errors.extraField} />}
                        />
                    </Row>
                )}
            </CardContent>
            {selectedAccountOption && (
                <ButtonWrapper>
                    {(!addressVerified || addressVerified !== address) &&
                        selectedAccountOption.account && (
                            <Button
                                onClick={() => {
                                    if (selectedAccountOption.account) {
                                        verifyAddress(selectedAccountOption.account, true);
                                    }
                                }}
                            >
                                <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR" />
                            </Button>
                        )}
                    {((addressVerified && addressVerified === address) ||
                        selectedAccountOption?.type === 'NON_SUITE') && (
                        <Button
                            onClick={() => {
                                if (address) {
                                    confirmTrade(address, extraField);
                                }
                            }}
                            isDisabled={!formState.isValid}
                        >
                            <Translation id="TR_EXCHANGE_GO_TO_PAYMENT" />
                        </Button>
                    )}
                </ButtonWrapper>
            )}
        </Wrapper>
    );
};

export default VerifyAddressComponent;
