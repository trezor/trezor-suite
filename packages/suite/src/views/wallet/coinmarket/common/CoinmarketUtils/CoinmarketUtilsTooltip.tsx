import { Icon, Tooltip } from '@trezor/components';
import { useTheme } from 'styled-components';
import { Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';
import { TooltipIcon, TooltipText, TooltipWrap } from 'src/views/wallet/coinmarket';
import { CoinmarketUtilsTooltipFee } from 'src/views/wallet/coinmarket/common/CoinmarketUtils/CoinmarketUtilsTooltipFee';
import { CoinmarketOffersItemProps } from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffersItem';

// IN TESTING MODE
export const CoinmarketUtilsTooltip = ({ quote }: Pick<CoinmarketOffersItemProps, 'quote'>) => {
    const theme = useTheme();
    const { translationString } = useTranslation();
    const isFeesIncluded = false;
    const notIncludedContent = translationString('TR_COINMARKET_FEES_ON_WEBSITE');

    if (isFeesIncluded) {
        return (
            <Tooltip content={<CoinmarketUtilsTooltipFee quote={quote} />} placement="bottom">
                <TooltipWrap>
                    <TooltipIcon>
                        <Icon name="info" size="small" color={theme.textDefault} />
                    </TooltipIcon>
                    <TooltipText>
                        <Translation id="TR_COINMARKET_FEES_INCLUDED" />
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
                    <Translation id="TR_COINMARKET_FEES_NOT_INCLUDED" />
                </TooltipText>
            </TooltipWrap>
        </Tooltip>
    );
};
