import React, { useState } from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { Button, variables } from '@trezor/components';
import { CoinmarketTransactionId } from '@wallet-components';
import { Translation } from '@suite-components/Translation';
import { BuyTrade } from 'invity-api';
import { Account } from '@wallet-types';
import invityAPI from '@suite-services/invityAPI';
import { createTxLink } from '@wallet-utils/coinmarket/buyUtils';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import { useActions } from '@suite-hooks';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px 60px 20px;
    flex-direction: column;
`;

const Image = styled.img``;

const Title = styled.div`
    margin-top: 25px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Description = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 17px 0 10px 0;
    max-width: 200px;
    text-align: center;
`;

// const CancelButton = styled(Button)`
//     margin-top: 15px;
// `;

const PaymentButton = styled(Button)`
    margin-top: 30px;
`;

interface Props {
    transactionId?: string;
    trade: BuyTrade;
    account: Account;
}

const WaitingForPayment = ({ transactionId, trade, account }: Props) => {
    const [isWorking, setIsWorking] = useState(false);
    const { submitRequestForm } = useActions({
        submitRequestForm: coinmarketCommonActions.submitRequestForm,
    });

    const goToPayment = async () => {
        setIsWorking(true);
        const returnUrl = await createTxLink(trade, account);
        const response = await invityAPI.getBuyTradeForm({ trade, returnUrl });
        if (response) {
            submitRequestForm(response.form);
        }
    };
    // const cancelTrade = () => {};
    return (
        <Wrapper>
            <Image src={resolveStaticPath('/images/svg/coinmarket-waiting.svg')} />
            <Title>
                <Translation id="TR_BUY_DETAIL_SUBMITTED_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_BUY_DETAIL_SUBMITTED_TEXT" />
            </Description>
            {transactionId && <CoinmarketTransactionId transactionId={transactionId} />}
            <PaymentButton onClick={goToPayment} isLoading={isWorking} isDisabled={isWorking}>
                <Translation id="TR_BUY_DETAIL_SUBMITTED_GATE" />
            </PaymentButton>
            {/* TODO add a possibility in the future to cancel the transaction by the user                
            <CancelButton isWhite variant="tertiary" onClick={cancelTrade}>
                <Translation id="TR_BUY_DETAIL_SUBMITTED_CANCEL" />
            </CancelButton> */}
        </Wrapper>
    );
};

export default WaitingForPayment;
