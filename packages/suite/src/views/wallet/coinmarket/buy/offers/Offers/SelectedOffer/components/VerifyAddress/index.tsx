import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { getUnusedAddressFromAccount } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import {
    FiatValue,
    QuestionTooltip,
    Translation,
    AccountLabeling,
    FormattedCryptoAmount,
} from 'src/components/suite';
import {
    Input,
    Button,
    variables,
    CoinLogo,
    useElevation,
    baseInputStyle,
} from '@trezor/components';
import { useCoinmarketBuyOffersContext } from 'src/hooks/wallet/useCoinmarketBuyOffers';
import { AddressOptions } from 'src/views/wallet/coinmarket/common';
import { useAccountAddressDictionary } from 'src/hooks/wallet/useAccounts';
import { ConfirmedOnTrezor } from 'src/views/wallet/coinmarket/common/ConfirmedOnTrezor';
import { AddressOptionsFormState } from 'src/types/wallet/coinmarketBuyOffers';
import { Elevation, mapElevationToBackground } from '@trezor/theme';
import { HTMLAttributes } from 'react';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const CardContent = styled.div`
    display: flex;
    flex-direction: column;
    padding: 24px;
`;

const LogoWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: 0 0 0 15px;
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

const CryptoWrapper = styled.div`
    padding-right: 3px;
`;

const FiatWrapper = styled.div`
    padding: 0 0 0 3px;
`;

const CustomLabel = styled(Label)`
    padding-bottom: 12px;
`;

const LabelText = styled.div``;

const Amount = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const AccountName = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledFakeInput = styled.div<HTMLAttributes<HTMLDivElement> & { elevation: Elevation }>`
    ${baseInputStyle}
    display: flex;
    margin-bottom: 20px;
    padding: 5px;
    min-height: 61px;
    align-items: center;
`;

const FakeInput = (props: HTMLAttributes<HTMLDivElement>) => {
    const { elevation } = useElevation();

    return <StyledFakeInput {...props} elevation={elevation} />;
};

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin: 20px 0;
`;

const VerifyAddressComponent = () => {
    const {
        account,
        device,
        callInProgress,
        verifyAddress,
        selectedQuote,
        goToPayment,
        addressVerified,
    } = useCoinmarketBuyOffersContext();
    const { symbol, formattedBalance } = account;
    const { path, address: unusedAddress } = getUnusedAddressFromAccount(account);

    const { watch, setValue, control } = useForm<AddressOptionsFormState>({
        mode: 'onChange',
        defaultValues: { address: unusedAddress },
    });

    const addressDictionary = useAccountAddressDictionary(account);
    const { address } = watch();
    const accountAddress = address ? addressDictionary[address] : undefined;

    if (!path || !address || !selectedQuote) {
        return null;
    }

    return (
        <Wrapper>
            <CardContent>
                <CustomLabel>
                    <LabelText>
                        <Translation id="TR_BUY_RECEIVING_ACCOUNT" />
                    </LabelText>
                    <StyledQuestionTooltip tooltip="TR_BUY_RECEIVE_ACCOUNT_QUESTION_TOOLTIP" />
                </CustomLabel>
                <FakeInput>
                    <LogoWrapper>
                        <CoinLogo size={25} symbol={symbol} />
                    </LogoWrapper>
                    <AccountWrapper>
                        <AccountName>
                            <AccountLabeling account={account} />
                        </AccountName>
                        <Amount>
                            <CryptoWrapper>
                                <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />
                            </CryptoWrapper>
                            •
                            <FiatWrapper>
                                <FiatValue amount={formattedBalance} symbol={symbol} />
                            </FiatWrapper>
                        </Amount>
                    </AccountWrapper>
                </FakeInput>
                {account?.networkType === 'bitcoin' ? (
                    <>
                        <CustomLabel>
                            <Translation id="TR_BUY_RECEIVING_ADDRESS" />
                            <StyledQuestionTooltip tooltip="TR_BUY_RECEIVE_ADDRESS_QUESTION_TOOLTIP" />
                        </CustomLabel>
                        <AddressOptions
                            account={account}
                            control={control}
                            receiveSymbol={account.symbol}
                            setValue={setValue}
                            address={address}
                        />
                    </>
                ) : (
                    <Input
                        label={
                            <Label>
                                <Translation id="TR_BUY_RECEIVING_ADDRESS" />
                                <StyledQuestionTooltip tooltip="TR_BUY_RECEIVE_ADDRESS_QUESTION_TOOLTIP" />
                            </Label>
                        }
                        value={address}
                        readOnly
                    />
                )}
                {addressVerified && addressVerified === address && (
                    <ConfirmedOnTrezor device={device} />
                )}
            </CardContent>
            <ButtonWrapper>
                {(!addressVerified || addressVerified !== address) && (
                    <Button
                        isLoading={callInProgress}
                        isDisabled={callInProgress}
                        data-test="@coinmarket/buy/offers/confirm-on-trezor-button"
                        onClick={() => {
                            if (accountAddress && address) {
                                verifyAddress(account, address, accountAddress.path);
                            }
                        }}
                    >
                        <Translation id="TR_BUY_CONFIRM_ON_TREZOR" />
                    </Button>
                )}
                {addressVerified && addressVerified === address && (
                    <Button
                        isLoading={callInProgress}
                        isDisabled={callInProgress}
                        data-test="@coinmarket/buy/offers/finish-transaction-button"
                        onClick={() => goToPayment(address)}
                    >
                        <Translation id="TR_BUY_GO_TO_PAYMENT" />
                    </Button>
                )}
            </ButtonWrapper>
        </Wrapper>
    );
};

export default VerifyAddressComponent;
