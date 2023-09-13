import { forwardRef } from 'react';

import { formatNetworkAmount, isTestnet } from '@suite-common/wallet-utils';
import { selectDevice } from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite/useSelector';

import Indicator from './Indicator';
import OutputElement, { OutputElementLine } from './OutputElement';
import type { OutputListProps } from './OutputList';
import { getOutputState } from './getOutputState';
import { getIsUpdatedSendFlow } from './getIsUpdatedSendFlow';

type StepIndicatorProps = Pick<OutputListProps, 'signedTx' | 'outputs' | 'buttonRequestsCount'>;

const StepIndicator = ({ signedTx, outputs, buttonRequestsCount }: StepIndicatorProps) => {
    const state = signedTx ? 'success' : getOutputState(outputs.length, buttonRequestsCount);

    return <Indicator state={state} size={16} />;
};

type TotalOutputProps = Omit<
    OutputListProps,
    'precomposedForm' | 'decision' | 'detailsOpen' | 'isRbfAction'
>;

export const TotalOutput = forwardRef<HTMLDivElement, TotalOutputProps>(
    ({ account, signedTx, outputs, buttonRequestsCount, precomposedTx }, ref) => {
        const device = useSelector(selectDevice);

        if (!device) {
            return null;
        }

        const { symbol } = account;
        const isUpdatedSendFlow = getIsUpdatedSendFlow(device);

        const lines: Array<OutputElementLine> = isUpdatedSendFlow
            ? [
                  {
                      id: 'total',
                      label: <Translation id="TR_TOTAL_AMOUNT" />,
                      value: formatNetworkAmount(precomposedTx.totalSpent, symbol),
                  },
                  {
                      id: 'fee',
                      label: <Translation id="TR_INCLUDING_FEE" />,
                      value: formatNetworkAmount(precomposedTx.fee, symbol),
                  },
              ]
            : [
                  {
                      id: 'total',
                      label: <Translation id="TR_TOTAL" />,
                      value: formatNetworkAmount(precomposedTx.totalSpent, symbol),
                  },
              ];

        return (
            <OutputElement
                account={account}
                indicator={
                    <StepIndicator
                        signedTx={signedTx}
                        outputs={outputs}
                        buttonRequestsCount={buttonRequestsCount}
                    />
                }
                lines={lines}
                cryptoSymbol={symbol}
                fiatSymbol={symbol}
                fiatVisible={!isTestnet(symbol)}
                ref={ref}
            />
        );
    },
);
