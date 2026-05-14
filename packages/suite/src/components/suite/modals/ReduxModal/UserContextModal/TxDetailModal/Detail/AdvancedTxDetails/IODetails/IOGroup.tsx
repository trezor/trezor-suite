import { Translation } from '@suite/intl';
import { type NetworkSymbolExtended } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { Column, Icon, InfoSegments, Row, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite/useSelector';
import { selectFullSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { type IODetailsType } from './IODetailsType';
import { IOItem } from './IOItem';

export type IOGroupProps = {
    /**
     * Transaction details can be passed also token's details so NetworkSymbolExtended is necessary
     */
    tx: Omit<WalletAccountTransaction, 'symbol'> & { symbol: NetworkSymbolExtended };
    contractAddress?: string;
    inputs: IODetailsType[];
    outputs: IODetailsType[];
    hasHeadings?: boolean;
    isUtxoBased?: boolean;
    isPhishingTransaction?: boolean;
};

export const IOGroup = ({
    tx,
    contractAddress,
    inputs,
    outputs,
    hasHeadings = true,
    isUtxoBased = false,
    isPhishingTransaction,
}: IOGroupProps) => {
    const selectedAccount = useSelector(selectFullSelectedAccount);

    const anonymitySet = selectedAccount?.account?.addresses?.anonymitySet;
    const hasInputs = !!inputs?.length;
    const hasOutputs = !!outputs?.length;

    if (!hasInputs && !hasOutputs) return null;

    return (
        <Row gap={60} alignItems="stretch" justifyContent="space-between">
            {hasInputs && (
                <Column width="40%" flex="0 0 40%" gap={8}>
                    {hasHeadings && (
                        <InfoSegments
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                        >
                            <Text typographyStyle="body-sm-strong" intent="neutral">
                                <Translation id="TR_INPUTS" />
                            </Text>
                            {isUtxoBased && inputs.length}
                        </InfoSegments>
                    )}

                    {inputs.map(input => (
                        <IOItem
                            key={`input-${input.n}`}
                            anonymitySet={anonymitySet}
                            symbol={tx.symbol}
                            contractAddress={contractAddress}
                            value={input.addresses?.[0]}
                            amount={input.value}
                            isPhishingTransaction={isPhishingTransaction}
                        />
                    ))}
                </Column>
            )}
            {hasInputs && hasOutputs && (
                <Row alignSelf="center">
                    <Icon name="arrowRight" size={16} intent="neutral" priority="secondary" />
                </Row>
            )}
            {hasOutputs && (
                <Column width="40%" flex="0 0 40%" gap={8}>
                    {hasHeadings && (
                        <InfoSegments
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                        >
                            <Text typographyStyle="body-sm-strong" intent="neutral">
                                <Translation id="TR_OUTPUTS" />
                            </Text>
                            {isUtxoBased && outputs.length}
                        </InfoSegments>
                    )}
                    {outputs.map(output => (
                        <IOItem
                            key={`output-${output.n}`}
                            anonymitySet={anonymitySet}
                            symbol={tx.symbol}
                            contractAddress={contractAddress}
                            value={output.addresses?.[0]}
                            amount={output.value}
                            isPhishingTransaction={isPhishingTransaction}
                        />
                    ))}
                </Column>
            )}
        </Row>
    );
};
