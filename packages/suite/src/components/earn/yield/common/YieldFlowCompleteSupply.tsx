import { Translation } from '@suite/intl';
import { type YieldFlowCompleteValue } from '@suite-common/wallet-core';
import { Divider, Row, Text } from '@trezor/components';

import { ApyValue } from 'src/views/wallet/staking/components/ApyValue';

import { YieldFlowComplete } from './YieldFlowComplete';
import { YieldFlowTransferRow } from './YieldFlowTransferRow';

type YieldFlowCompleteSupplyProps = {
    input: YieldFlowCompleteValue;
    output: YieldFlowCompleteValue;
    apy?: number | null;
};

export const YieldFlowCompleteSupply = ({ input, output, apy }: YieldFlowCompleteSupplyProps) => (
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
                <ApyValue apy={apy} />
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
