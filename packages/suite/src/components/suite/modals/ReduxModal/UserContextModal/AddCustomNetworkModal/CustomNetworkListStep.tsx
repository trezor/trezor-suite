import { useMemo, useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { type CustomEvmNetworkDefinition } from '@suite-common/wallet-types';
import {
    Banner,
    Card,
    Column,
    Icon,
    Input,
    Modal,
    Row,
    Spinner,
    Text,
    VirtualizedList,
} from '@trezor/components';
import { MagnifyingGlassIcon } from '@trezor/icons';

import { useCustomNetworkCatalogue } from 'src/hooks/settings/useCustomNetworkCatalogue';

import { CUSTOM_NETWORK_ROW_HEIGHT, CustomNetworkListRow } from './CustomNetworkListRow';
import { filterCustomNetworks } from './filterCustomNetworks';

const LIST_HEIGHT = 'min(480px, 55vh)';

type CustomNetworkListStepProps = {
    onSelect: (network: CustomEvmNetworkDefinition) => void;
    onCancel: () => void;
};

export const CustomNetworkListStep = ({ onSelect, onCancel }: CustomNetworkListStepProps) => {
    const { translationString } = useTranslation();
    const { networks, isLoading, hasError } = useCustomNetworkCatalogue();
    const [searchQuery, setSearchQuery] = useState('');

    const listItems = useMemo(
        () =>
            filterCustomNetworks(networks, searchQuery).map((network, index) => ({
                network,
                index,
                height: CUSTOM_NETWORK_ROW_HEIGHT,
            })),
        [networks, searchQuery],
    );

    return (
        <Modal
            width={600}
            onCancel={onCancel}
            heading={<Translation id="TR_ADD_CUSTOM_NETWORK" />}
            description={<Translation id="TR_SUPPORTED_EVM_NETWORKS" />}
            data-testid="@add-custom-network/list"
        >
            <Column gap={16} alignItems="stretch">
                <Input
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    onClear={() => setSearchQuery('')}
                    placeholder={translationString('TR_SEARCH_NETWORK')}
                    showClearButton
                    width="100%"
                    data-testid="@add-custom-network/search"
                    leftContent={
                        <Icon
                            as={MagnifyingGlassIcon}
                            intent="neutral"
                            priority="secondary"
                            size={16}
                        />
                    }
                />

                {hasError && (
                    <Banner
                        intent="critical"
                        description={<Translation id="TR_CUSTOM_NETWORKS_LOAD_ERROR" />}
                    />
                )}

                {isLoading && (
                    <Row justifyContent="center" padding={{ vertical: 32 }}>
                        <Spinner size={24} />
                    </Row>
                )}

                {!isLoading && !hasError && listItems.length === 0 && (
                    <Row justifyContent="center" padding={{ vertical: 32 }}>
                        <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                            <Translation id="TR_NO_NETWORKS_FOUND" />
                        </Text>
                    </Row>
                )}

                {listItems.length > 0 && (
                    <Card paddingType="none">
                        <VirtualizedList
                            items={listItems}
                            listHeight={LIST_HEIGHT}
                            listMinHeight={CUSTOM_NETWORK_ROW_HEIGHT}
                            getItemKey={({ network }) => network.chainId}
                            renderItem={({ network, index }) => (
                                <CustomNetworkListRow
                                    network={network}
                                    hasDivider={index > 0}
                                    onSelect={onSelect}
                                />
                            )}
                        />
                    </Card>
                )}
            </Column>
        </Modal>
    );
};
