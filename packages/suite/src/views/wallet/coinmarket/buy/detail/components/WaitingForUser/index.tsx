import { useState } from 'react';
import styled from 'styled-components';
import { Button, variables, Image } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { BuyTrade, BuyTradeStatus } from 'invity-api';
import { Account } from 'src/types/wallet';
import invityAPI from 'src/services/suite/invityAPI';
import { createTxLink } from 'src/utils/wallet/coinmarket/buyUtils';
import { submitRequestForm } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import { useDispatch } from 'src/hooks/suite';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    flex-direction: column;
`;

const Title = styled.div`
    margin-top: 25px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Description = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 17px 0 10px;
    max-width: 200px;
    text-align: center;
`;

const PaymentButton = styled(Button)`
    margin-top: 30px;
`;

const getTranslations = (tradeStatus: BuyTradeStatus | undefined) => {
    if (tradeStatus === 'WAITING_FOR_USER') {
        return {
            titleTranslationId: 'TR_BUY_DETAIL_WAITING_FOR_USER_TITLE',
            descriptionTranslationId: 'TR_BUY_DETAIL_WAITING_FOR_USER_TEXT',
            buttonTextTranslationId: 'TR_BUY_DETAIL_WAITING_FOR_USER_GATE',
        } as const;
    }

    return {
        titleTranslationId: 'TR_BUY_DETAIL_SUBMITTED_TITLE',
        descriptionTranslationId: 'TR_BUY_DETAIL_SUBMITTED_TEXT',
        buttonTextTranslationId: 'TR_BUY_DETAIL_SUBMITTED_GATE',
    } as const;
};

interface WaitingForUserProps {
    trade: BuyTrade;
    account: Account;
    providerName?: string;
}

const WaitingForUser = ({ trade, account, providerName }: WaitingForUserProps) => {
    const [isWorking, setIsWorking] = useState(false);
    const dispatch = useDispatch();

    const goToPayment = async () => {
        setIsWorking(true);
        const returnUrl = await createTxLink(trade, account);
        const response = await invityAPI.getBuyTradeForm({ trade, returnUrl });
        if (response) {
            dispatch(submitRequestForm(response.form));
        }
    };

    const translations = getTranslations(trade.status);

    return (
        <Wrapper>
            <Image image="COINMARKET_WAITING" />
            <Title>
                <Translation id={translations.titleTranslationId} />
            </Title>
            <Description>
                <Translation id={translations.descriptionTranslationId} values={{ providerName }} />
            </Description>
            <PaymentButton onClick={goToPayment} isLoading={isWorking} isDisabled={isWorking}>
                <Translation id={translations.buttonTextTranslationId} />
            </PaymentButton>
            {/* TODO add a possibility in the future to cancel the transaction by the user */}
        </Wrapper>
    );
};

export default WaitingForUser;
