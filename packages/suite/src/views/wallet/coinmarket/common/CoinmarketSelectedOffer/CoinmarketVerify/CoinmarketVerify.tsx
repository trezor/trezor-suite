import styled from 'styled-components';
import addressValidator from '@trezor/address-validator';
import { QuestionTooltip, Translation } from 'src/components/suite';
import { Input, variables, Button } from '@trezor/components';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { ConfirmedOnTrezor } from 'src/views/wallet/coinmarket/common/ConfirmedOnTrezor';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeBuyExchangeType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketVerifyOptions } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketVerify/CoinmarketVerifyOptions';
import { CoinmarketVerifyAccountReturnProps } from 'src/types/coinmarket/coinmarketVerify';
import { CryptoId } from 'invity-api';
import { isCoinmarketExchangeOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { isHexValid, isInteger } from '@suite-common/wallet-utils';
import { CoinmarketAddressOptions } from 'src/views/wallet/coinmarket/common/CoinmarketAddressOptions';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const Heading = styled.div`
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
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
    border-top: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    margin: 20px 0;
`;

const Row = styled.div`
    margin: 12px 0;
`;

interface CoinmarketVerifyProps {
    coinmarketVerifyAccount: CoinmarketVerifyAccountReturnProps;
    currency: CryptoId;
}

export const CoinmarketVerify = ({ coinmarketVerifyAccount, currency }: CoinmarketVerifyProps) => {
    const { translationString } = useTranslation();
    const { cryptoIdToCoinSymbol, cryptoIdToNativeCoinSymbol } = useCoinmarketInfo();
    const context = useCoinmarketFormContext<CoinmarketTradeBuyExchangeType>();
    const { callInProgress, device, verifyAddress, addressVerified, confirmTrade } = context;
    const exchangeQuote = isCoinmarketExchangeOffers(context) ? context.selectedQuote : null;
    const {
        form,
        selectedAccountOption,
        accountAddress,
        receiveNetwork,
        selectAccountOptions,
        isMenuOpen,
        getTranslationIds,
        onChangeAccount,
    } = coinmarketVerifyAccount;

    const address = form.watch('address');
    const extraField = form.watch('extraField');
    const extraFieldDescription = exchangeQuote?.extraFieldDescription
        ? {
              extraFieldName: exchangeQuote?.extraFieldDescription?.name,
              extraFieldDescription: exchangeQuote?.extraFieldDescription?.description,
              toCurrency: exchangeQuote?.receive,
          }
        : {};

    const { accountTooltipTranslationId, addressTooltipTranslationId } = getTranslationIds(
        selectedAccountOption?.type,
    );

    const { ref: networkRef, ...networkField } = form.register('address', {
        required: translationString('TR_EXCHANGE_RECEIVING_ADDRESS_REQUIRED'),
        validate: value => {
            if (selectedAccountOption?.type === 'NON_SUITE' && currency) {
                const symbol = cryptoIdToNativeCoinSymbol(currency);
                if (value && !addressValidator.validate(value, symbol)) {
                    return translationString('TR_EXCHANGE_RECEIVING_ADDRESS_INVALID');
                }
            }
        },
    });

    const { ref: descriptionRef, ...descriptionField } = form.register('extraField', {
        required: exchangeQuote?.extraFieldDescription?.required
            ? translationString('TR_EXCHANGE_EXTRA_FIELD_REQUIRED', extraFieldDescription)
            : undefined,
        validate: value => {
            let valid = true;
            if (value) {
                if (exchangeQuote?.extraFieldDescription?.type === 'hex') {
                    valid = isHexValid(value);
                } else if (exchangeQuote?.extraFieldDescription?.type === 'number') {
                    valid = isInteger(value);
                }
            }
            if (!valid) {
                return translationString('TR_EXCHANGE_EXTRA_FIELD_INVALID', extraFieldDescription);
            }
        },
    });

    return (
        <Wrapper>
            <Heading>
                <Translation
                    id="TR_EXCHANGE_RECEIVING_ADDRESS_INFO"
                    values={{ symbol: cryptoIdToCoinSymbol(currency) }}
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
                    <CoinmarketVerifyOptions
                        receiveNetwork={receiveNetwork ?? currency}
                        selectedAccountOption={selectedAccountOption}
                        selectAccountOptions={selectAccountOptions}
                        isMenuOpen={isMenuOpen}
                        onChangeAccount={onChangeAccount}
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
                                <CoinmarketAddressOptions
                                    account={selectedAccountOption?.account}
                                    address={address}
                                    control={form.control}
                                    receiveSymbol={currency}
                                    setValue={form.setValue}
                                />
                            </>
                        )}
                    {selectedAccountOption?.account?.networkType !== 'bitcoin' && (
                        <>
                            <CustomLabel>
                                <StyledQuestionTooltip
                                    label="TR_EXCHANGE_RECEIVING_ADDRESS"
                                    tooltip={addressTooltipTranslationId}
                                />
                            </CustomLabel>
                            <Input
                                readOnly={selectedAccountOption?.type !== 'NON_SUITE'}
                                inputState={form.formState.errors.address ? 'error' : undefined}
                                bottomText={form.formState.errors.address?.message || null}
                                innerRef={networkRef}
                                {...networkField}
                            />
                        </>
                    )}

                    {addressVerified && addressVerified === address && (
                        <ConfirmedOnTrezor device={device} />
                    )}
                    {exchangeQuote?.extraFieldDescription && (
                        <Row>
                            <Input
                                size="small"
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
                                inputState={form.formState.errors.extraField ? 'error' : undefined}
                                bottomText={form.formState.errors.extraField?.message || null}
                                innerRef={descriptionRef}
                                {...descriptionField}
                            />
                        </Row>
                    )}
                </Row>
            </CardContent>
            {selectedAccountOption && (
                <ButtonWrapper>
                    {(!addressVerified || addressVerified !== address) &&
                        selectedAccountOption.account && (
                            <Button
                                data-testid="@coinmarket/offer/confirm-on-trezor-button"
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
                            data-testid="@coinmarket/offer/continue-transaction-button"
                            isLoading={callInProgress}
                            onClick={() => {
                                if (address) {
                                    confirmTrade(address, extraField);
                                }
                            }}
                            isDisabled={!form.formState.isValid || callInProgress}
                        >
                            <Translation id="TR_BUY_GO_TO_PAYMENT" />
                        </Button>
                    )}
                </ButtonWrapper>
            )}
        </Wrapper>
    );
};
