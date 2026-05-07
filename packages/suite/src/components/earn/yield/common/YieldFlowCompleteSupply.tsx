import { Translation } from '@suite/intl';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type YieldFlowCompleteValue } from '@suite-common/wallet-core';
import { Divider, Row, Text } from '@trezor/components';

import { EarnYieldApyTooltip } from 'src/components/earn/dashboard/yield/EarnYieldApyTooltip';

import { YieldFlowComplete } from './YieldFlowComplete';
import { YieldFlowTransferRow } from './YieldFlowTransferRow';

type YieldFlowCompleteSupplyProps = {
    input: YieldFlowCompleteValue;
    output: YieldFlowCompleteValue;
    apy?: number | null;
    vault: YieldDto;
    networkSymbol: NetworkSymbol;
};

export const YieldFlowCompleteSupply = ({
    input,
    output,
    apy,
    vault,
    networkSymbol,
}: YieldFlowCompleteSupplyProps) => (
    <YieldFlowComplete
        type="supply"
        heading={<Translation id="TR_EARN_YIELD_SUPPLY_COMPLETE" />}
        description={<Translation id="TR_EARN_YIELD_SUPPLY_COMPLETE_DESCRIPTION" />}
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
            inputLabelId="TR_EARN_YIELD_SUPPLIED"
            outputLabelId="TR_RECEIVED"
            input={input}
            output={output}
        />
    </YieldFlowComplete>
);
