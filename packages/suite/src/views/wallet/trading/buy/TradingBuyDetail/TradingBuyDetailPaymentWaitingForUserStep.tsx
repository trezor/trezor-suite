import { useState } from 'react';

import { type BuyTrade } from 'invity-api';

import { Translation, type TranslationKey } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import { tradeApi } from '@suite-common/trading';
import { Button, Card, Column, Paragraph, type StepListItemState } from '@trezor/components';
import { ArrowSquareOutIcon } from '@trezor/icons';

import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
import { type Account } from 'src/types/wallet';
import { createTxLink } from 'src/utils/wallet/trading/buyUtils';
import { TradingDetailStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailStep';

type TradingBuyDetailPaymentWaitingForUserStepProps = {
    trade: BuyTrade;
    account: Account;
    providerName?: string;
};

const getStepState = (trade: BuyTrade): StepListItemState => {
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

export const TradingBuyDetailPaymentWaitingForUserStep = ({
    trade,
    account,
    providerName,
}: TradingBuyDetailPaymentWaitingForUserStepProps) => {
    const [isWorking, setIsWorking] = useState(false);
    const dispatch = useDispatch();
    const state = getStepState(trade);

    const goToPayment = async () => {
        setIsWorking(true);
        const returnUrl = await createTxLink(trade, account);
        const response = await tradeApi.getBuyTradeForm({ trade, returnUrl });
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
                        iconRight={ArrowSquareOutIcon}
                    >
                        <Translation id={getButtonLabelId(trade)} />
                    </Button>
                </Column>
            </Card>
        </TradingDetailStep>
    );
};
