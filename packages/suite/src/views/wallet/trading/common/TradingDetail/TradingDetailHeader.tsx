import { Translation } from '@suite/intl';
import { H3, Paragraph } from '@trezor/components';

import { type DetailHeaderMessages } from 'src/views/wallet/trading/common/TradingDetail/utils';

type TradingDetailHeaderProps = DetailHeaderMessages & {
    type: string;
};

export const TradingDetailHeader = ({ title, description, type }: TradingDetailHeaderProps) => (
    <>
        <H3 data-testid="@trading/transaction/detail/header">
            <Translation id={title} values={{ type }} />
        </H3>
        <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
            <Translation id={description} values={{ type }} />
        </Paragraph>
    </>
);
