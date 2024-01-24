import styled from 'styled-components';
import { Controller } from 'react-hook-form';

import { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import {
    AddressOptions,
    KycError,
    KycFailed,
    KycInProgress,
} from 'src/views/wallet/coinmarket/common';
import { Button, SelectBar, variables } from '@trezor/components';
import { useSavingsSetupContinue } from 'src/hooks/wallet/useCoinmarketSavingsSetupContinue';
import { Translation } from 'src/components/suite';
import FiatAmount from '../components/FiatAmount';
import Summary from '../components/Summary';
import { AllFeesIncluded } from '../../AllFeesIncluded';
import { ProvidedBy } from '../../ProvidedBy';
import { CoinmarketReauthorizationCard } from '../../CoinmarketReauthorizationCard';
import { withCoinmarket } from '../../withCoinmarket';

const Header = styled.div`
    font-weight: 500;
    font-size: 24px;
    line-height: 30px;
    margin-bottom: 16px;
`;

const Label = styled.div`
    padding-right: 20px;
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    margin-bottom: 11px;
`;

const StyledSelectBar = styled(SelectBar)`
    width: 100%;

    & div div {
        justify-content: center;
    }
`;

const FrequencyStyledSelectBar = styled(StyledSelectBar)`
    margin-bottom: 26px;
` as typeof StyledSelectBar;

const AddressOptionsWrapper = styled.div`
    margin-bottom: 16px;
`;

const ReceivingAddressChangesPaymentInfoLabel = styled.div`
    margin-top: 8px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 30px;
`;

const CoinmarketSavingsSetupContinue = (props: WithSelectedAccountLoadedProps) => {
    const {
        control,
        annualSavingsCryptoAmount,
        annualSavingsFiatAmount,
        fiatAmount,
        fiatCurrency,
        formState: { errors },
        isWatchingKYCStatus,
        canConfirmSetup,
        account,
        setValue,
        address,
        handleSubmit,
        onSubmit,
        isSubmitting,
        paymentAmounts,
        paymentFrequencyOptions,
        minimumPaymentAmountLimit,
        maximumPaymentAmountLimit,
        isSavingsTradeLoading,
        savingsTrade,
        kycFinalStatus,
        selectedProviderName,
        showReceivingAddressChangePaymentInfoLabel,
    } = useSavingsSetupContinue(props);

    const reauthorizationUrl = savingsTrade?.reauthorizationUrl;

    if (isSavingsTradeLoading || !savingsTrade) {
        return <Translation id="TR_LOADING" />;
    }

    return (
        <form>
            {reauthorizationUrl && (
                <CoinmarketReauthorizationCard reauthorizationUrl={reauthorizationUrl} />
            )}
            {isWatchingKYCStatus && <KycInProgress />}
            {!isWatchingKYCStatus && kycFinalStatus === 'Failed' && (
                <KycFailed providerName={selectedProviderName} />
            )}
            {!isWatchingKYCStatus && kycFinalStatus === 'Error' && <KycError />}
            <Header>
                <Translation id="TR_SAVINGS_SETUP_HEADER" />
            </Header>
            <Label>
                <Translation id="TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_LABEL" />
            </Label>
            <Controller
                control={control}
                name="paymentFrequency"
                defaultValue={savingsTrade?.paymentFrequency}
                render={({ field: { onChange, value } }) => (
                    <FrequencyStyledSelectBar
                        onChange={onChange}
                        selectedOption={value}
                        options={paymentFrequencyOptions}
                    />
                )}
            />
            <FiatAmount
                control={control}
                customFiatAmountError={errors.customFiatAmount}
                defaultFiatAmount={savingsTrade?.fiatStringAmount}
                maximumPaymentAmountLimit={maximumPaymentAmountLimit}
                minimumPaymentAmountLimit={minimumPaymentAmountLimit}
                paymentAmounts={paymentAmounts}
                fiatAmount={fiatAmount}
                fiatCurrency={fiatCurrency}
            />
            <AllFeesIncluded />
            <Summary
                accountSymbol={account.symbol}
                annualSavingsCryptoAmount={annualSavingsCryptoAmount}
                annualSavingsFiatAmount={annualSavingsFiatAmount}
                fiatCurrency={fiatCurrency}
            />
            <Label>
                <Translation id="TR_SAVINGS_SETUP_RECEIVING_ADDRESS" />
            </Label>
            <AddressOptionsWrapper>
                <AddressOptions
                    account={account}
                    control={control}
                    receiveSymbol={account.symbol}
                    setValue={setValue}
                    address={address}
                    menuPlacement="auto"
                />
                {showReceivingAddressChangePaymentInfoLabel && (
                    <ReceivingAddressChangesPaymentInfoLabel>
                        <Translation id="TR_SAVINGS_SETUP_RECEIVING_ADDRESS_CHANGES_PAYMENT_INFO" />
                    </ReceivingAddressChangesPaymentInfoLabel>
                )}
            </AddressOptionsWrapper>
            <Footer>
                <Button
                    isDisabled={!canConfirmSetup}
                    isLoading={isSubmitting}
                    onClick={handleSubmit(onSubmit)}
                >
                    <Translation id="TR_SAVINGS_SETUP_CONFIRM_BUTTON" />
                </Button>
                <ProvidedBy providerName={selectedProviderName} />
            </Footer>
        </form>
    );
};

export default withCoinmarket(CoinmarketSavingsSetupContinue, {
    title: 'TR_NAV_INVITY',
});
