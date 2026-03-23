import { useState } from 'react';

import { Translation } from '@suite/intl';
import { InfoItem, Text, TextButton, Tooltip } from '@trezor/components';

import { TradingOfferExchangeSlippageModal } from '../TradingOfferExchange/TradingOfferExchangeSlippageModal';

type TradingExchangeSlippageInfoItemProps = {
    isEditable?: boolean;
    slippage: string;
};

export const TradingExchangeSlippageInfoItem = ({
    isEditable = false,
    slippage,
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
                        iconRight="pencilSimple"
                        intent="brand"
                        isUnderlined
                    >
                        {slippage}%
                    </TextButton>
                ) : (
                    <Text typographyStyle="body-sm">{slippage}%</Text>
                )}
            </InfoItem>

            {isEditModalOpen && (
                <TradingOfferExchangeSlippageModal onClose={() => setIsEditModalOpen(false)} />
            )}
        </>
    );
};
