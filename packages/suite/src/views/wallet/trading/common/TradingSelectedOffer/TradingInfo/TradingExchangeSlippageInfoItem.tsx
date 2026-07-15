import { useState } from 'react';

import { type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { InfoItem, Text, TextButton, Tooltip } from '@trezor/components';
import { PencilSimpleIcon } from '@trezor/icons';

import { TradingOfferExchangeSlippageModal } from 'src/views/wallet/trading/exchange/TradingOfferExchangeSlippageModal/TradingOfferExchangeSlippageModal';

type TradingExchangeSlippageInfoItemProps = {
    isEditable?: boolean;
    slippage: string;
    selectedQuote?: ExchangeTrade;
};

export const TradingExchangeSlippageInfoItem = ({
    isEditable = false,
    slippage,
    selectedQuote,
}: TradingExchangeSlippageInfoItemProps) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    return (
        <>
            <InfoItem
                label={
                    <Tooltip content={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_INFO" />} hasIcon>
                        <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_AMOUNT" />
                    </Tooltip>
                }
                direction="row"
            >
                {isEditable ? (
                    <TextButton
                        onClick={() => setIsEditModalOpen(true)}
                        size="small"
                        iconRight={PencilSimpleIcon}
                        intent="brand"
                        isUnderlined
                        data-testid="@trading/offer/info/slippage"
                    >
                        {slippage}%
                    </TextButton>
                ) : (
                    <Text typographyStyle="body-sm" data-testid="@trading/offer/info/slippage">
                        {slippage}%
                    </Text>
                )}
            </InfoItem>

            {isEditModalOpen && selectedQuote && (
                <TradingOfferExchangeSlippageModal
                    selectedQuote={selectedQuote}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}
        </>
    );
};
