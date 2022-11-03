import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import addressValidator from 'trezor-address-validator';
import { QuestionTooltip, Translation } from '@suite-components';
import { Input, variables, DeviceImage, Button } from '@trezor/components';
import { InputError } from '@wallet-components';
import { useCoinmarketExchangeOffersContext } from '@wallet-hooks/useCoinmarketExchangeOffers';
import { TypedValidationRules } from '@wallet-types/form';
import { isHexValid, isInteger } from '@suite-common/wallet-utils';
import { AddressOptions } from '@wallet-views/coinmarket/common/AddressOptions';
import { useAccountAddressDictionary } from '@wallet-hooks/useAccounts';
import { ReceiveOptions, AccountSelectOption } from './ReceiveOptions';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const Heading = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    padding: 16px 24px 0 24px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const CardContent = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 24px 0 24px;
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
`;

const StyledDeviceImage = styled(DeviceImage)`
    padding: 0 10px 0 0;
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
    margin-top: 27px;
`;

const Row = styled.div`
    margin: 12px 0;
`;

type FormState = {
    address?: string;
    extraField?: string;
};

const getTranslationIds = (type: AccountSelectOption['type'] | undefined) => {
    if (type === 'NON_SUITE') {
        return {
            accountTooltipTranslationId: 'TR_EXCHANGE_RECEIVE_NON_SUITE_ACCOUNT_QUESTION_TOOLTIP',
            addressTooltipTranslationId: 'TR_EXCHANGE_RECEIVE_NON_SUITE_ADDRESS_QUESTION_TOOLTIP',
        } as const;
    }
    return {
        accountTooltipTranslationId: 'TR_EXCHANGE_RECEIVE_ACCOUNT_QUESTION_TOOLTIP',
        addressTooltipTranslationId: 'TR_EXCHANGE_RECEIVE_ADDRESS_QUESTION_TOOLTIP',
    } as const;
};

const VerifyAddressComponent = () => {
    const {
        callInProgress,
        device,
        verifyAddress,
        confirmTrade,
        selectedQuote,
        addressVerified,
        receiveSymbol,
    } = useCoinmarketExchangeOffersContext();
    const [selectedAccountOption, setSelectedAccountOption] = useState<AccountSelectOption>();
    const { register, watch, errors, formState, setValue, control } = useForm<FormState>({
        mode: 'onChange',
    });

    const typedRegister: (rules?: TypedValidationRules) => (ref: any) => void = useCallback(
        <T,>(rules?: T) => register(rules),
        [register],
    );

    const addressDictionary = useAccountAddressDictionary(selectedAccountOption?.account);
    const { address, extraField } = watch();
    const accountAddress = address && addressDictionary[address];

    const extraFieldDescription = selectedQuote?.extraFieldDescription
        ? {
              extraFieldName: selectedQuote?.extraFieldDescription?.name,
              extraFieldDescription: selectedQuote?.extraFieldDescription?.description,
              toCurrency: selectedQuote?.receive,
          }
        : {};

    const formErrors = !formState.isValid;

    const { accountTooltipTranslationId, addressTooltipTranslationId } = getTranslationIds(
        selectedAccountOption?.type,
    );

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
                        <StyledQuestionTooltip
                            label="TR_EXCHANGE_RECEIVING_ACCOUNT"
                            tooltip={accountTooltipTranslationId}
                        />
                    </CustomLabel>
                    <ReceiveOptions
                        selectedAccountOption={selectedAccountOption}
                        setSelectedAccountOption={setSelectedAccountOption}
                        setValue={setValue}
                    />
                </Row>
                <Row>
                    {selectedAccountOption?.type === 'SUITE' &&
                        selectedAccountOption?.account?.networkType === 'bitcoin' && (
                            <>
                                <CustomLabel>
                                    <StyledQuestionTooltip
                                        label="TR_EXCHANGE_RECEIVING_ADDRESS"
                                        tooltip={addressTooltipTranslationId}
                                    />
                                </CustomLabel>
                                <AddressOptions
                                    account={selectedAccountOption?.account}
                                    address={address}
                                    control={control}
                                    receiveSymbol={receiveSymbol}
                                    setValue={setValue}
                                />
                            </>
                        )}
                    {selectedAccountOption?.account?.networkType !== 'bitcoin' && (
                        <Input
                            label={
                                <Label>
                                    <StyledQuestionTooltip
                                        label="TR_EXCHANGE_RECEIVING_ADDRESS"
                                        tooltip={addressTooltipTranslationId}
                                    />
                                </Label>
                            }
                            variant="small"
                            name="address"
                            innerRef={typedRegister({
                                required: 'TR_EXCHANGE_RECEIVING_ADDRESS_REQUIRED',
                                validate: value => {
                                    if (
                                        selectedAccountOption?.type === 'NON_SUITE' &&
                                        receiveSymbol
                                    ) {
                                        if (!addressValidator.validate(value, receiveSymbol)) {
                                            return 'TR_EXCHANGE_RECEIVING_ADDRESS_INVALID';
                                        }
                                    }
                                },
                            })}
                            readOnly={selectedAccountOption?.type !== 'NON_SUITE'}
                            inputState={errors.address ? 'error' : undefined}
                            bottomText={<InputError error={errors.address} />}
                        />
                    )}

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
                            inputState={errors.extraField ? 'error' : undefined}
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
                                data-test="@coinmarket/exchange/offers/confirm-on-trezor-button"
                                isLoading={callInProgress}
                                isDisabled={callInProgress}
                                onClick={() => {
                                    if (selectedAccountOption.account && accountAddress) {
                                        verifyAddress(
                                            selectedAccountOption.account,
                                            accountAddress.address,
                                            accountAddress.path,
                                        );
                                    }
                                }}
                            >
                                <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR" />
                            </Button>
                        )}
                    {((addressVerified && addressVerified === address) ||
                        selectedAccountOption?.type === 'NON_SUITE') && (
                        <Button
                            data-test="@coinmarket/exchange/offers/continue-transaction-button"
                            isLoading={callInProgress}
                            onClick={() => {
                                if (address) {
                                    confirmTrade(address, extraField);
                                }
                            }}
                            isDisabled={formErrors || callInProgress}
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
