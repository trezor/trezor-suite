import { Translation } from '@suite/intl';
import { Button, Column, Row } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { YieldAmountCard } from './YieldAmountCard';

type YieldUnwrapStepProps = {
    tokenSymbol: string;
    tokenDecimals: number;
    tokenBalance: string;
    onMaxClick: () => void;
    onSubmit: () => void;
    onSkip: () => void;
};

export const YieldUnwrapStep = ({
    tokenSymbol,
    tokenDecimals,
    tokenBalance,
    onMaxClick,
    onSubmit,
    onSkip,
}: YieldUnwrapStepProps) => (
    <Column gap={16}>
        <YieldAmountCard
            tokenSymbol={tokenSymbol}
            decimals={tokenDecimals}
            heading={{
                amountLabelTranslationId: 'TR_EARN_YIELD_UNWRAP_AMOUNT',
            }}
            summary={{
                labelTranslationId: 'TR_BALANCE',
                value: <FormattedCryptoAmount value={tokenBalance} symbol={tokenSymbol} />,
                onMaxClick,
            }}
        />

        <Row gap={8} width="100%">
            <Button size="large" flex="1" onClick={onSubmit}>
                <Translation id="TR_EARN_YIELD_UNWRAP_SUBMIT" values={{ tokenSymbol }} />
            </Button>
            <Button size="large" intent="neutral" priority="secondary" onClick={onSkip}>
                <Translation id="TR_SKIP" />
            </Button>
        </Row>
    </Column>
);
