import { useState } from 'react';

import { type BuyTrade } from 'invity-api';

import { Translation, type TranslationKey } from '@suite/intl';
import { invityAPI } from '@suite-common/trading';
import { type BulletListItemState, Button, Card, Column, Paragraph } from '@trezor/components';

import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
import { useDispatch } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';
import { createTxLink } from 'src/utils/wallet/trading/buyUtils';

import { TradingDetailStep } from '../TradingDetailStep';

type TradingDetailBuyPaymentWaitingForUserStepProps = {
    trade: BuyTrade;
    account: Account;
    providerName?: string;
};

const getState = (trade: BuyTrade): BulletListItemState => {
    switch (trade.status) {
        case 'APPROVAL_PENDING':
            return 'done';
        default:
            return 'active';
    }
};

const getTitleId = (trade: BuyTrade): TranslationKey => {
    switch (trade.status) {
        case 'APPROVAL_PENDING':
            return 'TR_BUY_DETAIL_PAYMENT_SUCCESSFUL_TITLE';
        default:
            return 'TR_BUY_DETAIL_WAITING_FOR_USER_TITLE';
    }
};

const getDescriptionId = (trade: BuyTrade): TranslationKey => {
    switch (trade.status) {
        case 'SUBMITTED':
            return 'TR_BUY_DETAIL_SUBMITTED_TEXT';
        default:
            return 'TR_BUY_DETAIL_WAITING_FOR_USER_TEXT';
    }
};

const getButtonLabelId = (trade: BuyTrade): TranslationKey => {
    switch (trade.status) {
        case 'SUBMITTED':
            return 'TR_BUY_DETAIL_SUBMITTED_GATE';
        default:
            return 'TR_BUY_DETAIL_WAITING_FOR_USER_GATE';
    }
};

export const TradingDetailBuyPaymentWaitingForUserStep = ({
    trade,
    account,
    providerName,
}: TradingDetailBuyPaymentWaitingForUserStepProps) => {
    const [isWorking, setIsWorking] = useState(false);
    const dispatch = useDispatch();
    const state = getState(trade);

    const goToPayment = async () => {
        setIsWorking(true);
        const returnUrl = await createTxLink(trade, account);
        const response = await invityAPI.getBuyTradeForm({ trade, returnUrl });
        if (response) {
            dispatch(submitRequestForm(response.form));
        }
    };

    return (
        <TradingDetailStep state={state} title={<Translation id={getTitleId(trade)} />}>
            <Card>
                <Column gap={20}>
                    <Paragraph typographyStyle="body-sm">
                        <Translation id={getDescriptionId(trade)} values={{ providerName }} />
                    </Paragraph>
                    <Button
                        onClick={goToPayment}
                        isLoading={isWorking}
                        isDisabled={isWorking}
                        iconRight="arrowSquareOut"
                    >
                        <Translation id={getButtonLabelId(trade)} />
                    </Button>
                </Column>
            </Card>
        </TradingDetailStep>
    );
};
