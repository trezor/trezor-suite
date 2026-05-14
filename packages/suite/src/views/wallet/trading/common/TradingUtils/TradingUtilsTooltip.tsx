import { Translation, useTranslation } from '@suite/intl';
import { type TradingTradeType } from '@suite-common/trading';
import { Icon, Tooltip } from '@trezor/components';

import { TooltipIcon, TooltipText, TooltipWrap } from 'src/views/wallet/trading';
import { TradingUtilsTooltipFee } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsTooltipFee';

// IN TESTING MODE
export const TradingUtilsTooltip = ({ quote }: { quote: TradingTradeType }) => {
    const { translationString } = useTranslation();
    const isFeesIncluded = false;
    const notIncludedContent = translationString('TR_TRADING_FEES_ON_WEBSITE');

    if (isFeesIncluded) {
        return (
            <Tooltip content={<TradingUtilsTooltipFee quote={quote} />} placement="bottom">
                <TooltipWrap>
                    <TooltipIcon>
                        <Icon name="info" size={12} color="contentPrimary" />
                    </TooltipIcon>
                    <TooltipText>
                        <Translation id="TR_TRADING_FEES_INCLUDED" />
                    </TooltipText>
                </TooltipWrap>
            </Tooltip>
        );
    }

    return (
        <Tooltip content={notIncludedContent} placement="bottom">
            <TooltipWrap>
                <TooltipIcon>
                    <Icon name="info" size={12} color="contentWarning" />
                </TooltipIcon>
                <TooltipText $isYellow>
                    <Translation id="TR_TRADING_FEES_NOT_INCLUDED" />
                </TooltipText>
            </TooltipWrap>
        </Tooltip>
    );
};
