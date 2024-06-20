import { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import addressValidator from 'trezor-address-validator';
import { QuestionTooltip, Translation } from 'src/components/suite';
import { Input, variables, Button } from '@trezor/components';
import { AddressOptions } from 'src/views/wallet/coinmarket/common';
import { useAccountAddressDictionary } from 'src/hooks/wallet/useAccounts';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { ConfirmedOnTrezor } from 'src/views/wallet/coinmarket/common/ConfirmedOnTrezor';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import CoinmarketSelectedOfferVerifyOptions, {
    AccountSelectOption,
} from './CoinmarketSelectedOfferVerifyOptions';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const Heading = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    padding: 16px 24px 0;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const CardContent = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 24px;
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

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin: 20px 0;
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
        accountTooltipTranslationId: 'TR_BUY_RECEIVE_ACCOUNT_QUESTION_TOOLTIP',
        addressTooltipTranslationId: 'TR_BUY_RECEIVE_ADDRESS_QUESTION_TOOLTIP',
    } as const;
};

const CoinmarketSelectedOfferVerify = () => {
    const { callInProgress, device, verifyAddress, selectedQuote, addressVerified, goToPayment } =
        useCoinmarketFormContext<CoinmarketTradeBuyType>();
    const [selectedAccountOption, setSelectedAccountOption] = useState<AccountSelectOption>();

    const {
        register,
        watch,
        formState: { errors, isValid },
        setValue,
        control,
    } = useForm<FormState>({
        mode: 'onChange',
    });

    const address = form.watch('address');
    const { accountTooltipTranslationId, addressTooltipTranslationId } = getTranslationIds(
        selectedAccountOption?.type,
    );

    const { ref: networkRef, ...networkField } = register('address', {
        required: translationString('TR_EXCHANGE_RECEIVING_ADDRESS_REQUIRED'),
        validate: value => {
            if (selectedAccountOption?.type === 'NON_SUITE' && selectedQuote?.receiveCurrency) {
                if (value && !addressValidator.validate(value, selectedQuote.receiveCurrency)) {
                    return translationString('TR_EXCHANGE_RECEIVING_ADDRESS_INVALID');
                }
            }
        },
    });

    if (!selectedQuote?.receiveCurrency) {
        return null;
    }

    return (
        <Wrapper>
            <Heading>
                <Translation
                    id="TR_EXCHANGE_RECEIVING_ADDRESS_INFO"
                    values={{ symbol: cryptoToCoinSymbol(selectedQuote.receiveCurrency) }}
                />
            </Heading>
            <CardContent>
                <Row>
                    <CustomLabel>
                        <StyledQuestionTooltip
                            label="TR_BUY_RECEIVING_ACCOUNT"
                            tooltip={accountTooltipTranslationId}
                        />
                    </CustomLabel>
                    <CoinmarketSelectedOfferVerifyOptions
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
                                        label="TR_BUY_RECEIVING_ADDRESS"
                                        tooltip={addressTooltipTranslationId}
                                    />
                                </CustomLabel>
                                <AddressOptions
                                    account={selectedAccountOption?.account}
                                    address={address}
                                    control={control}
                                    receiveSymbol={selectedQuote.receiveCurrency}
                                    setValue={setValue}
                                />
                            </>
                        )}
                    {selectedAccountOption?.account?.networkType !== 'bitcoin' && (
                        <Input
                            label={
                                <Label>
                                    <StyledQuestionTooltip
                                        label="TR_BUY_RECEIVING_ADDRESS"
                                        tooltip={addressTooltipTranslationId}
                                    />
                                </Label>
                            }
                            size="small"
                            readOnly={selectedAccountOption?.type !== 'NON_SUITE'}
                            inputState={errors.address ? 'error' : undefined}
                            bottomText={errors.address?.message || null}
                            innerRef={networkRef}
                            {...networkField}
                        />
                    )}

                    {addressVerified && addressVerified === address && (
                        <ConfirmedOnTrezor device={device} />
                    )}
                </Row>
            </CardContent>
            {selectedAccountOption && (
                <ButtonWrapper>
                    {(!addressVerified || addressVerified !== address) &&
                        selectedAccountOption.account && (
                            <Button
                                data-test="@coinmarket/offer/confirm-on-trezor-button"
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
                                <Translation id="TR_BUY_CONFIRM_ON_TREZOR" />
                            </Button>
                        )}
                    {((addressVerified && addressVerified === address) ||
                        selectedAccountOption?.type === 'NON_SUITE') && (
                        <Button
                            data-test="@coinmarket/offer/continue-transaction-button"
                            isLoading={callInProgress}
                            onClick={() => {
                                if (address) {
                                    goToPayment(address);
                                    // confirmTrade(address, extraField);
                                }
                            }}
                            isDisabled={!isValid || callInProgress}
                        >
                            <Translation id="TR_BUY_GO_TO_PAYMENT" />
                        </Button>
                    )}
                </ButtonWrapper>
            )}
        </Wrapper>
    );
};

export default CoinmarketSelectedOfferVerify;
