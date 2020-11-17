import React from 'react';
import styled from 'styled-components';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';
import {
    FiatValue,
    QuestionTooltip,
    Translation,
    HiddenPlaceholder,
    AccountLabeling,
} from '@suite-components';
import { Input, Button, colors, variables, CoinLogo, DeviceImage } from '@trezor/components';
import { useCoinmarketBuyOffersContext } from '@wallet-hooks/useCoinmarketBuyOffers';

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

const UpperCase = styled.div`
    text-transform: uppercase;
    padding: 0 3px;
`;

const FiatWrapper = styled.div`
    padding: 0 0 0 3px;
`;

const CustomLabel = styled(Label)`
    padding-bottom: 12px;
`;

const LabelText = styled.div``;

const StyledDeviceImage = styled(DeviceImage)`
    padding: 0 10px 0 0;
`;

const Amount = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const AccountName = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const FakeInput = styled.div`
    display: flex;
    margin-bottom: 20px;
    padding: 5px;
    min-height: 61px;
    align-items: center;
    border-radius: 4px;
    border: solid 2px ${colors.NEUE_STROKE_GREY};
    background: ${colors.WHITE};
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
    margin: 20px 0;
`;

const Confirmed = styled.div`
    display: flex;
    height: 60px;
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    background: ${colors.NEUE_BG_GRAY};
    align-items: center;
    justify-content: center;
`;

const VerifyAddressComponent = () => {
    const {
        account,
        device,
        verifyAddress,
        selectedQuote,
        goToPayment,
        addressVerified,
    } = useCoinmarketBuyOffersContext();
    const { symbol, formattedBalance } = account;
    const { path, address } = getUnusedAddressFromAccount(account);

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
                            <HiddenPlaceholder>{formattedBalance}</HiddenPlaceholder>{' '}
                            <UpperCase>{symbol}</UpperCase> •
                            <FiatWrapper>
                                <FiatValue amount={formattedBalance} symbol={symbol} />
                            </FiatWrapper>
                        </Amount>
                    </AccountWrapper>
                </FakeInput>
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
                {addressVerified && addressVerified === address && (
                    <Confirmed>
                        {device && (
                            <StyledDeviceImage
                                height={25}
                                trezorModel={device.features?.major_version === 1 ? 1 : 2}
                            />
                        )}
                        <Translation id="TR_BUY_CONFIRMED_ON_TREZOR" />
                    </Confirmed>
                )}
            </CardContent>
            <ButtonWrapper>
                {(!addressVerified || addressVerified !== address) && (
                    <Button onClick={() => verifyAddress(account)}>
                        <Translation id="TR_BUY_CONFIRM_ON_TREZOR" />
                    </Button>
                )}
                {addressVerified && addressVerified === address && (
                    <Button onClick={() => goToPayment(address)}>
                        <Translation id="TR_BUY_GO_TO_PAYMENT" />
                    </Button>
                )}
            </ButtonWrapper>
        </Wrapper>
    );
};

export default VerifyAddressComponent;
