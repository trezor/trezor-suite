import { TradingType } from '@suite-common/trading';
import { Button, Flex, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { INVITY_SCHEDULE_OF_FEES } from '@trezor/urls';

import { Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';
import { translationKeys } from 'src/utils/wallet/trading/tradingUtils';

type TradingFormFeesDisclamerProps = {
    tradingType: TradingType;
};

export const TradingFormFeesDisclamer = ({ tradingType }: TradingFormFeesDisclamerProps) => {
    const { translationString } = useTranslation();

    return (
        <Flex gap={spacings.sm}>
            <Paragraph variant="tertiary">
                <Translation
                    id="TR_TRADING_FEES_DISCLAIMER"
                    values={{
                        tradingType: translationString(translationKeys[tradingType]).toLowerCase(),
                    }}
                />
            </Paragraph>
            <Button
                href={INVITY_SCHEDULE_OF_FEES}
                icon="arrowUpRight"
                iconAlignment="end"
                variant="tertiary"
                size="tiny"
            >
                <Translation id="TR_LEARN_MORE" />
            </Button>
        </Flex>
    );
};
