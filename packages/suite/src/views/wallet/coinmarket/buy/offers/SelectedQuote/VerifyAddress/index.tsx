import React from 'react';
import styled from 'styled-components';
import { BuyTrade } from '@suite/services/invityAPI/buyTypes';
import { getAccountInfo } from '@wallet-utils/coinmarket/buyUtils';
import { FiatValue } from '@suite-components';
import * as coinmarketActions from '@wallet-actions/coinmarketActions';
import { useActions, useSelector } from '@suite-hooks';
import { Input, Button, colors, variables, CoinLogo } from '@trezor/components';

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
    padding: 0 0 0 10px;
`;

const AccountWrapper = styled.div`
    display: flex;
    padding: 0 0 0 10px;
    flex-direction: column;
`;

const Label = styled.div`
    display: flex;
    padding-bottom: 10px;
`;

const Amount = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const AccountName = styled.div`
    display: flex;
`;

const FakeInput = styled.div`
    display: flex;
    margin-bottom: 20px;
    padding: 5px;
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
    align-items: center;
    justify-content: center;
`;

interface Props {
    selectedQuote: BuyTrade | null;
}

const VerifyAddress = ({ selectedQuote }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const addressVerified = useSelector(state => state.wallet.coinmarket.addressVerified);
    const { verifyAddress } = useActions({ verifyAddress: coinmarketActions.verifyAddress });
    if (selectedAccount.status !== 'loaded' || !selectedQuote) return null;
    const { account } = selectedAccount;
    const { symbol, index, availableBalance } = account;

    const { path, address } = getAccountInfo(account);

    if (!path || !address) {
        console.log('handle error');
        return null;
    }

    return (
        <Wrapper>
            <CardContent>
                <Label>Receiving account</Label>
                <FakeInput>
                    <LogoWrapper>
                        <CoinLogo size={25} symbol={symbol} />
                    </LogoWrapper>
                    <AccountWrapper>
                        <AccountName>Account #{index + 1}</AccountName>
                        <Amount>
                            {availableBalance} {symbol} •
                            <FiatValue amount={availableBalance} symbol={symbol} />
                        </Amount>
                    </AccountWrapper>
                </FakeInput>
                <Input label="Receive address" value={address} />
                {addressVerified && <Confirmed>Confirmed on trezor</Confirmed>}
            </CardContent>
            <ButtonWrapper>
                {!addressVerified && (
                    <Button onClick={() => verifyAddress(path, address)}>
                        Review &amp; confirm
                    </Button>
                )}
                {addressVerified && <Button onClick={() => {}}>Go to payment</Button>}
            </ButtonWrapper>
        </Wrapper>
    );
};

export default VerifyAddress;
