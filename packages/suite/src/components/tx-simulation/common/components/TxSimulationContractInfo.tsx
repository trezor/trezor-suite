import { Translation } from '@suite/intl';
import { type TransactionSimulation } from '@suite-common/tx-simulation';
import { type Network, getExplorerUrl } from '@suite-common/wallet-config';
import { selectExplorer } from '@suite-common/wallet-core';
import { CollapsibleBox, Column, H4, Link, Row, Text } from '@trezor/components';

import { Address } from 'src/components/suite/Address';
import { useExternalLink, useSelector } from 'src/hooks/suite';
import { getTokenAddressTranslationId } from 'src/utils/wallet/tokenUtils';

interface TxSimulationContractInfoProps {
    targetContract: string;
    simulation: TransactionSimulation;
    network: Network;
}

export function TxSimulationContractInfo({
    targetContract,
    simulation,
    network,
}: TxSimulationContractInfoProps) {
    const explorer = useSelector(state => selectExplorer(state, network.symbol));
    const explorerLink = useExternalLink(
        `${getExplorerUrl(explorer, 'address')}${targetContract}${explorer?.queryString ?? ''}`,
    );

    return (
        <CollapsibleBox
            heading={
                <Row gap={8} alignItems="center" justifyContent="space-between" flex="1">
                    <H4 typographyStyle="body-sm-strong" flex="1">
                        <Translation id="TR_CONTRACT_INFO" />
                    </H4>
                </Row>
            }
        >
            <Column
                hasDivider
                margin={{
                    // Negative margins to align with collapsible box
                    horizontal: -16,
                    // Negative margins to align with collapsible box
                    vertical: -20,
                }}
            >
                {[
                    {
                        label: <Translation id="TR_PROTOCOL" />,
                        value: Object.entries(simulation.address_details).find(
                            ([address]) => address.toLowerCase() === targetContract.toLowerCase(),
                        )?.[1]?.name_tag,
                    },
                    {
                        label: (
                            <Translation id={getTokenAddressTranslationId(network.networkType)} />
                        ),
                        value: (
                            <Link href={explorerLink}>
                                <Address
                                    value={targetContract}
                                    isTruncated
                                    isCopyAllowed
                                    typographyStyle="body-xs"
                                />
                            </Link>
                        ),
                    },
                    {
                        label: <Translation id="TR_CONTRACT_FUNCTION" />,
                        value: simulation.params?.calldata?.function_signature,
                    },
                ].map((item, index) =>
                    item.value ? (
                        <Row
                            key={index}
                            gap={8}
                            padding={{
                                horizontal: 16,
                                vertical: 12,
                            }}
                            alignItems="center"
                            justifyContent="flex-start"
                        >
                            <Text flex="1">{item.label}</Text>
                            <Text flex="2" overflowWrap="break-word" typographyStyle="body-xs">
                                {item.value}
                            </Text>
                        </Row>
                    ) : null,
                )}
            </Column>
        </CollapsibleBox>
    );
}
