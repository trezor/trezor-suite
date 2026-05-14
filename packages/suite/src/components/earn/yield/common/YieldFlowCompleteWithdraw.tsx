import { Translation } from '@suite/intl';
import { type YieldFlowCompleteValue } from '@suite-common/wallet-core';
import { Column, Row, Text } from '@trezor/components';

import { YieldFlowComplete } from './YieldFlowComplete';
import { YieldTokenValue } from './YieldTokenValue';

type YieldFlowCompleteWithdrawProps = {
    value: YieldFlowCompleteValue;
};

export const YieldFlowCompleteWithdraw = ({ value }: YieldFlowCompleteWithdrawProps) => (
    <YieldFlowComplete
        type="withdraw"
        heading={<Translation id="TR_EARN_YIELD_WITHDRAW_COMPLETE" />}
        description={
            <Translation
                id="TR_EARN_YIELD_WITHDRAW_COMPLETE_DESCRIPTION"
                values={{ displaySymbol: value.token.symbol }}
            />
        }
        showFeedback
    >
        <Row
            justifyContent="space-between"
            alignItems="center"
            padding={{ vertical: 16, horizontal: 20 }}
        >
            <Column gap={8}>
                <Text typographyStyle="body-md">
                    <Translation id="TR_EARN_YIELD_AMOUNT_TO_WITHDRAW" />
                </Text>
                <YieldTokenValue
                    token={{
                        ...value.token,
                        contractAddress: value.token.contractAddress ?? null,
                    }}
                    amount={value.amount}
                />
            </Column>
        </Row>
    </YieldFlowComplete>
);
