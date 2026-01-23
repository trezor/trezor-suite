import { Translation } from '@suite/intl';
import { TransactionSimulation } from '@suite-common/tx-simulation';
import { Network, getExplorerUrl } from '@suite-common/wallet-config';
import { selectExplorer } from '@suite-common/wallet-core';
import { CollapsibleBox, Column, H4, Link, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

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
    const explorer = useSelector(state => selectExplorer(state, network?.symbol));
    const explorerLink = useExternalLink(
        `${getExplorerUrl(explorer, 'address')}${targetContract}${explorer?.queryString ?? ''}`,
    );

    return (
        <CollapsibleBox
            heading={
                <Row gap={spacings.xs} alignItems="center" justifyContent="space-between" flex="1">
                    <H4 typographyStyle="callout" flex="1">
                        <Translation id="TR_CONTRACT_INFO" />
                    </H4>
                </Row>
            }
        >
            <Column
                hasDivider
                margin={{
                    // @ts-expect-error - negative margins to align with collapsible box
                    horizontal: -spacings.md,
                    // @ts-expect-error - negative margins to align with collapsible box
                    vertical: -spacings.lg,
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
                                    typographyStyle="label"
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
                            gap={spacings.xs}
                            padding={{
                                horizontal: spacings.md,
                                vertical: spacings.sm,
                            }}
                            alignItems="center"
                            justifyContent="flex-start"
                        >
                            <Text flex="1">{item.label}</Text>
                            <Text flex="2" wordBreak="break-all" typographyStyle="label">
                                {item.value}
                            </Text>
                        </Row>
                    ) : null,
                )}
            </Column>
        </CollapsibleBox>
    );
}
