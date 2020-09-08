import React from 'react';
import styled from 'styled-components';
import { getAccountInfo, submitRequestForm, createTxLink } from '@wallet-utils/coinmarket/buyUtils';
import { FiatValue, QuestionTooltip, Translation } from '@suite-components';
import * as coinmarketCommonActions from '@wallet-actions/coinmarketCommonActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import { useActions, useSelector } from '@suite-hooks';
import { Input, Button, colors, variables, CoinLogo, DeviceImage } from '@trezor/components';
import invityAPI from '@suite-services/invityAPI';
import { BuyTrade } from 'invity-api';

interface Props {
    selectedQuote: BuyTrade;
}

const VerifyAddress = ({ selectedQuote }: Props) => {
    const selectedDevice = useSelector(state => state.suite.device);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const addressVerified = useSelector(state => state.wallet.coinmarket.buy.addressVerified);
    const { verifyAddress } = useActions({ verifyAddress: coinmarketCommonActions.verifyAddress });
    const { saveTrade } = useActions({ saveTrade: coinmarketBuyActions.saveTrade });
    if (selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;
    const { symbol, index, availableBalance } = account;
    const { path, address } = getAccountInfo(account);

    if (!path || !address) {
        return null;
    }

    return (
        <Wrapper>
            <CardContent>
                <CustomLabel>
                    <LabelText>
                        <Translation id="TR_BUY_RECEIVING_ACCOUNT" />
                    </LabelText>
                    <StyledQuestionTooltip messageId="TR_BUY_RECEIVE_ACCOUNT_QUESTION_TOOLTIP" />
                </CustomLabel>
                <FakeInput>
                    <LogoWrapper>
                        <CoinLogo size={25} symbol={symbol} />
                    </LogoWrapper>
                    <AccountWrapper>
                        <AccountName>Account #{index + 1}</AccountName>
                        <Amount>
                            {availableBalance} <UpperCase>{symbol}</UpperCase> •
                            <FiatWrapper>
                                <FiatValue amount={availableBalance} symbol={symbol} />
                            </FiatWrapper>
                        </Amount>
                    </AccountWrapper>
                </FakeInput>
                <Input
                    label={
                        <Label>
                            <Translation id="TR_BUY_RECEIVING_ADDRESS" />
                            <StyledQuestionTooltip messageId="TR_BUY_RECEIVE_ADDRESS_QUESTION_TOOLTIP" />
                        </Label>
                    }
                    value={address}
                    readOnly
                />
                {addressVerified && (
                    <Confirmed>
                        {selectedDevice && (
                            <StyledDeviceImage
                                height={25}
                                trezorModel={selectedDevice.features?.major_version === 1 ? 1 : 2}
                            />
                        )}
                        <Translation id="TR_BUY_CONFIRMED_ON_TREZOR" />
                    </Confirmed>
                )}
            </CardContent>
            <ButtonWrapper>
                {!addressVerified && (
                    <Button onClick={() => verifyAddress(path, address)}>
                        <Translation id="TR_BUY_CONFIRM_ON_TREZOR" />
                    </Button>
                )}
                {addressVerified && (
                    <Button
                        onClick={async () => {
                            const quote = { ...selectedQuote, receiveAddress: address };
                            const response = await invityAPI.doBuyTrade({
                                trade: quote,
                                returnUrl: createTxLink(selectedQuote, account),
                            });
                            if (!response || !response.trade || !response.trade.paymentId) {
                                // TODO - show error, something really bad happened
                                console.log('invalid response', response);
                            } else if (response.trade.error) {
                                // TODO - show error, trade failed, typically timeout
                                console.log('response error', response.trade.error);
                            } else {
                                await saveTrade(response.trade, account, new Date().toISOString());
                                // eslint-disable-next-line no-lonely-if
                                if (response.tradeForm) {
                                    submitRequestForm(response.tradeForm);
                                }
                            }
                        }}
                    >
                        <Translation id="TR_BUY_GO_TO_PAYMENT" />
                    </Button>
                )}
            </ButtonWrapper>
        </Wrapper>
    );
};

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

export default VerifyAddress;
