import styled from 'styled-components';

import { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Column, Grid, Icon, InfoSegments, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite/useSelector';

import { IODetails } from './IODetails';
import { IOItem } from './IOItem';

const GridWrapper = styled.div`
    position: relative;
`;

const IconWrapper = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
`;

const shouldHideExplorerLink = (vout: IODetails) =>
    vout.type === 'nulldata' || vout.hex?.startsWith('6a'); // with 6a prefix we can assume that it is a nulldata output, which is not a valid address

export type IOGroupProps = {
    /**
     * Transaction details can be passed also token's details so NetworkSymbolExtended is necessary
     */
    tx: Omit<WalletAccountTransaction, 'symbol'> & { symbol: NetworkSymbolExtended };
    contractAddress?: string;
    inputs: IODetails[];
    outputs: IODetails[];
    isPhishingTransaction?: boolean;
    hasHeadings?: boolean;
    isUtxoBased?: boolean;
};

export const IOGroup = ({
    tx,
    contractAddress,
    inputs,
    outputs,
    isPhishingTransaction,
    hasHeadings = true,
    isUtxoBased = false,
}: IOGroupProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const anonymitySet = selectedAccount?.account?.addresses?.anonymitySet;
    const hasInputs = !!inputs?.length;
    const hasOutputs = !!outputs?.length;

    if (!hasInputs && !hasOutputs) return null;

    return (
        <GridWrapper>
            {hasInputs && hasOutputs && (
                <IconWrapper>
                    <Icon name="arrowRight" size="medium" variant="tertiary" />
                </IconWrapper>
            )}
            <Grid columns={2} gap={spacings.xxxxl} forceEqualColumns>
                {hasInputs && (
                    <Column gap={spacings.xs} margin={{ right: spacings.xl }}>
                        {hasHeadings && (
                            <InfoSegments typographyStyle="hint" variant="tertiary">
                                <Text typographyStyle="callout" variant="default">
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
                                address={input.addresses?.[0]}
                                amount={input.value}
                                isPhishingTransaction={isPhishingTransaction}
                            />
                        ))}
                    </Column>
                )}
                {hasOutputs && (
                    <Column gap={spacings.xs} margin={{ left: spacings.xl }}>
                        {hasHeadings && (
                            <InfoSegments typographyStyle="hint" variant="tertiary">
                                <Text typographyStyle="callout" variant="default">
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
                                address={output.addresses?.[0]}
                                amount={output.value}
                                isPhishingTransaction={isPhishingTransaction}
                                hideExplorerLink={shouldHideExplorerLink(output)}
                            />
                        ))}
                    </Column>
                )}
            </Grid>
        </GridWrapper>
    );
};
