import styled from 'styled-components';
import addressValidator from '@trezor/address-validator';
import { QuestionTooltip, Translation } from 'src/components/suite';
import { Input, variables, Button } from '@trezor/components';
import { AddressOptions } from 'src/views/wallet/coinmarket/common';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { ConfirmedOnTrezor } from 'src/views/wallet/coinmarket/common/ConfirmedOnTrezor';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import useCoinmarketVerifyAccount from 'src/hooks/wallet/coinmarket/form/useCoinmarketVerifyAccount';
import CoinmarketSelectedOfferVerifyOptions from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferVerifyOptions';

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

// TODO: refactor with exchange redesign
const CoinmarketSelectedOfferVerify = () => {
    const { translationString } = useTranslation();
    const { callInProgress, device, verifyAddress, selectedQuote, addressVerified, goToPayment } =
        useCoinmarketFormContext<CoinmarketTradeBuyType>();
    const currency = selectedQuote?.receiveCurrency;
    const {
        form,
        selectedAccountOption,
        accountAddress,
        receiveNetwork,
        selectAccountOptions,
        isMenuOpen,
        getTranslationIds,
        onChangeAccount,
    } = useCoinmarketVerifyAccount({ currency });

    const address = form.watch('address');
    const { accountTooltipTranslationId, addressTooltipTranslationId } = getTranslationIds(
        selectedAccountOption?.type,
    );

    const { ref: networkRef, ...networkField } = form.register('address', {
        required: translationString('TR_EXCHANGE_RECEIVING_ADDRESS_REQUIRED'),
        validate: value => {
            if (selectedAccountOption?.type === 'NON_SUITE' && currency) {
                if (value && !addressValidator.validate(value, currency)) {
                    return translationString('TR_EXCHANGE_RECEIVING_ADDRESS_INVALID');
                }
            }
        },
    });

    if (!currency) {
        return null;
    }

    return (
        <Wrapper>
            <Heading>
                <Translation
                    id="TR_EXCHANGE_RECEIVING_ADDRESS_INFO"
                    values={{ symbol: cryptoToCoinSymbol(currency) }}
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
                                <AddressOptions
                                    account={selectedAccountOption?.account}
                                    address={address}
                                    control={form.control}
                                    receiveSymbol={selectedQuote.receiveCurrency}
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
                                    goToPayment(address);
                                    // confirmTrade(address, extraField);
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

export default CoinmarketSelectedOfferVerify;
