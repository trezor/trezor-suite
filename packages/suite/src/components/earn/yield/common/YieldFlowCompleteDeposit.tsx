import { Translation } from '@suite/intl';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type YieldFlowCompleteValue } from '@suite-common/wallet-core';
import { Divider, Row, Text } from '@trezor/components';

import { EarnYieldApyTooltip } from 'src/components/earn/dashboard/yield/EarnYieldApyTooltip';

import { YieldFlowComplete } from './YieldFlowComplete';
import { YieldFlowTransferRow } from './YieldFlowTransferRow';

type YieldFlowCompleteDepositProps = {
    input: YieldFlowCompleteValue;
    output: YieldFlowCompleteValue;
    apy?: number | null;
    vault: YieldDto;
    networkSymbol: NetworkSymbol;
};

export const YieldFlowCompleteDeposit = ({
    input,
    output,
    apy,
    vault,
    networkSymbol,
}: YieldFlowCompleteDepositProps) => (
    <YieldFlowComplete
        type="deposit"
        heading={<Translation id="TR_EARN_YIELD_DEPOSIT_COMPLETE" />}
        description={<Translation id="TR_EARN_YIELD_DEPOSIT_COMPLETE_DESCRIPTION" />}
        vaultId={vault.id}
        showFeedback
    >
        <Row
            justifyContent="space-between"
            alignItems="center"
            padding={{ vertical: 16, horizontal: 20 }}
        >
            <Text typographyStyle="body-md">
                <Translation id="TR_EARN_DASHBOARD_TABLE_APY" />
            </Text>
            <Text typographyStyle="body-md-strong">
                <EarnYieldApyTooltip
                    vault={vault}
                    apyPercentage={apy ?? null}
                    networkSymbol={networkSymbol}
                />
            </Text>
        </Row>
        <Divider color="borderNeutral" margin={0} />
        <YieldFlowTransferRow
            inputLabelId="TR_EARN_YIELD_DEPOSITED"
            outputLabelId="TR_RECEIVED"
            input={input}
            output={output}
        />
    </YieldFlowComplete>
);
