import { useTheme } from 'styled-components';

import { Icon, Tooltip } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';
import { TooltipIcon, TooltipText, TooltipWrap } from 'src/views/wallet/trading';
import { TradingOffersItemProps } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersItem';
import { TradingUtilsTooltipFee } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsTooltipFee';

// IN TESTING MODE
export const TradingUtilsTooltip = ({ quote }: Pick<TradingOffersItemProps, 'quote'>) => {
    const theme = useTheme();
    const { translationString } = useTranslation();
    const isFeesIncluded = false;
    const notIncludedContent = translationString('TR_TRADING_FEES_ON_WEBSITE');

    if (isFeesIncluded) {
        return (
            <Tooltip content={<TradingUtilsTooltipFee quote={quote} />} placement="bottom">
                <TooltipWrap>
                    <TooltipIcon>
                        <Icon name="info" size="small" color={theme.textDefault} />
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
                    <Icon name="info" size="small" color={theme.textAlertYellow} />
                </TooltipIcon>
                <TooltipText $isYellow>
                    <Translation id="TR_TRADING_FEES_NOT_INCLUDED" />
                </TooltipText>
            </TooltipWrap>
        </Tooltip>
    );
};
