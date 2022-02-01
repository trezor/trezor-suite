import React from 'react';
import { InputError, withInvityLayout, WithSelectedAccountLoadedProps } from '@wallet-components';
import styled from 'styled-components';
import KYCInProgress from './components/KYCInProgress';
import { Button, Input, SelectBar, variables } from '@trezor/components';
import { ReactSVG } from 'react-svg';
import { resolveStaticPath } from '@suite-utils/build';
import { useSavingsSetup } from '@wallet-hooks/coinmarket/savings/useSavingsSetup';
import { Controller } from 'react-hook-form';
import { FormattedCryptoAmount, FormattedNumber, Translation } from '@suite-components';

const Header = styled.div`
    font-weight: 500;
    font-size: 24px;
    line-height: 30px;
    margin-bottom: 35px;
`;

const Label = styled.div`
    padding-right: 20px;
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    margin-bottom: 11px;
`;

const StyledSelectBar = styled(SelectBar)`
    margin-bottom: 26px;
    width: 100%;
    & div div {
        justify-content: center;
    }
`;

const Divider = styled.div`
    margin: 15px 0;
    height: 1px;
    width: 100%;
    border: 1px solid ${props => props.theme.BG_GREY};
`;

const Summary = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Left = styled.div`
    display: flex;
    font-size: 16px;
    line-height: 24px;
    align-items: center;
`;

const Right = styled.div`
    display: flex;
    flex-direction: column;
`;

const Fiat = styled.div`
    font-size: 20px;
    line-height: 28px;
    color: ${props => props.theme.TYPE_GREEN};
    justify-content: end;
    display: flex;
`;

const FiatAmount = styled.div`
    display: flex;
`;

const FiatAmountLeftColumn = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
`;

const FiatAmountRightColumn = styled.div`
    display: flex;
    justify-content: flex-end;
    flex-direction: row;
`;

const Crypto = styled.div`
    font-size: 20px;
    line-height: 28px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    justify-content: end;
    display: flex;
`;

const StyledReactSVG = styled(ReactSVG)`
    margin: 0 10px;
`;
const Footer = styled.div`
    display: flex;
    align-items: center;
`;

const StyledInput = styled(Input)`
    display: flex;
    max-width: 70px;
    width: 70px;
`;

const getFiatAmountOptions = (amounts: string[]) =>
    amounts.map(amount => ({
        label: !Number.isNaN(Number(amount)) ? (
            <FormattedNumber
                value={amount}
                currency="eur"
                minimumFractionDigits={0}
                maximumFractionDigits={0}
            />
        ) : (
            amount
        ),
        value: amount,
    }));

const CoinmarketSavingsSetup = (props: WithSelectedAccountLoadedProps) => {
    const {
        control,
        defaultFiatAmount,
        defaultPaymentFrequency,
        annualSavingsCalculationFiat,
        annualSavingsCalculationCrypto,
        fiatAmount,
        register,
        errors,
        isWatchingKYCStatus,
        canConfirmSetup,
    } = useSavingsSetup(props);

    return (
        <form>
            {isWatchingKYCStatus && <KYCInProgress />}
            <Header>
                <Translation id="TR_SAVINGS_SETUP_HEADER" />
            </Header>
            <Label>
                <Translation id="TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_LABEL" />
            </Label>
            <Controller
                control={control}
                name="paymentFrequency"
                defaultValue={defaultPaymentFrequency}
                render={({ onChange, value }) => (
                    <StyledSelectBar
                        onChange={onChange}
                        selectedOption={value}
                        options={[
                            { label: 'Weekly', value: 'Weekly' },
                            { label: 'Biweekly', value: 'Biweekly' },
                            { label: 'Monthly', value: 'Monthly' },
                            { label: 'Quarterly', value: 'Quarterly' },
                        ]}
                    />
                )}
            />
            <Label>
                <Translation id="TR_SAVINGS_SETUP_FIAT_AMOUNT_LABEL" />
            </Label>
            <FiatAmount>
                <FiatAmountLeftColumn>
                    <Controller
                        control={control}
                        name="fiatAmount"
                        defaultValue={defaultFiatAmount}
                        render={({ onChange, value }) => (
                            <StyledSelectBar
                                onChange={onChange}
                                selectedOption={value}
                                options={getFiatAmountOptions(['10', '50', '100', '500', 'Custom'])}
                            />
                        )}
                    />
                </FiatAmountLeftColumn>
                {fiatAmount === 'Custom' && (
                    <FiatAmountRightColumn>
                        <StyledInput
                            name="customFiatAmount"
                            monospace
                            width={70}
                            noTopLabel
                            variant="small"
                            noError={!errors.customFiatAmount}
                            state={errors.customFiatAmount ? 'error' : 'success'}
                            bottomText={<InputError error={errors.customFiatAmount} />}
                            innerRef={register({
                                validate: (value: string) => {
                                    if (!value || Number.isNaN(Number(value))) {
                                        return 'TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_REQUIRED';
                                    }
                                    const numberValue = Number(value);
                                    if (numberValue < 10) {
                                        return 'TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_MINIMUM';
                                    }
                                },
                            })}
                        />
                    </FiatAmountRightColumn>
                )}
            </FiatAmount>

            <Divider />
            <Summary>
                <Left>
                    <Translation id="TR_SAVINGS_SETUP_SUMMARY_LABEL" />
                </Left>
                <Right>
                    <Fiat>
                        <FormattedNumber currency="EUR" value={annualSavingsCalculationFiat} />
                    </Fiat>
                    <Crypto>
                        ≈&nbsp;
                        <FormattedCryptoAmount
                            value={annualSavingsCalculationCrypto}
                            symbol="btc"
                        />
                    </Crypto>
                </Right>
            </Summary>
            <Divider />
            <Footer>
                <Button isDisabled={!canConfirmSetup}>
                    <Translation id="TR_SAVINGS_SETUP_CONFIRM_BUTTON" />
                </Button>
                <StyledReactSVG src={resolveStaticPath('images/svg/cloud-upload.svg')} />
                <Translation id="TR_SAVINGS_SETUP_CONTINUOUS_SAVING_NOTE" />
            </Footer>
        </form>
    );
};
export default withInvityLayout(CoinmarketSavingsSetup, {
    showStepsGuide: true,
});
