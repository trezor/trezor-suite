import { type BuyTrade } from 'invity-api';

import { Translation, type TranslationKey } from '@suite/intl';
import { Paragraph, type StepListItemState } from '@trezor/components';

import { TradingDetailStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailStep';

type TradingBuyDetailPaymentWaitingForUserStepProps = {
    state: StepListItemState;
    trade: BuyTrade;
    providerName?: string;
};

const getTitleId = (state: StepListItemState): TranslationKey =>
    state === 'active'
        ? 'TR_BUY_DETAIL_WAITING_FOR_USER_TITLE'
        : 'TR_BUY_DETAIL_PAYMENT_SUCCESSFUL_TITLE';

const getDescriptionId = (trade: BuyTrade): TranslationKey => {
    switch (trade.status) {
        case 'SUBMITTED':
            return 'TR_BUY_DETAIL_SUBMITTED_TEXT';
        default:
            return 'TR_BUY_DETAIL_WAITING_FOR_USER_TEXT';
    }
};

export const TradingBuyDetailPaymentWaitingForUserStep = ({
    state,
    trade,
    providerName,
}: TradingBuyDetailPaymentWaitingForUserStepProps) => (
    <TradingDetailStep state={state} title={<Translation id={getTitleId(state)} />}>
        <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
            <Translation id={getDescriptionId(trade)} values={{ providerName }} />
        </Paragraph>
    </TradingDetailStep>
);
