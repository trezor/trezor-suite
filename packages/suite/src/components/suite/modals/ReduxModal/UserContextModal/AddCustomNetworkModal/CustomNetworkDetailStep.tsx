import { useState } from 'react';

import { Translation, isTranslationKey, useTranslation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import { validateServerAddress } from '@suite-common/wallet-config';
import {
    type CustomEvmNetworkRejection,
    addCustomEvmNetworkThunk,
} from '@suite-common/wallet-core';
import { Banner, Card, Column, Divider, Modal, Row, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import {
    type CustomNetworkCatalogueEntry,
    isCatalogueEntryVetted,
} from '#src/utils/settings/customNetworks/customNetworkCatalogue';

import { CustomNetworkBadges } from './CustomNetworkBadges';
import { CustomNetworkDetailRow } from './CustomNetworkDetailRow';
import { CustomNetworkIcon } from './CustomNetworkIcon';
import { CUSTOM_RPC_URL_OPTION_VALUE, CustomNetworkRpcUrlField } from './CustomNetworkRpcUrlField';

const FALLBACK_ERROR_KEY = 'TR_CUSTOM_BACKEND_VALIDATION_ERROR';

type CustomNetworkDetailStepProps = {
    entry: CustomNetworkCatalogueEntry;
    onBackClick: () => void;
    onCancel: () => void;
};

export const CustomNetworkDetailStep = ({
    entry,
    onBackClick,
    onCancel,
}: CustomNetworkDetailStepProps) => {
    const { definition: network } = entry;
    const { translationString } = useTranslation();
    const { dispatch } = useServices(injectDispatch);
    const [selectedRpcValue, setSelectedRpcValue] = useState(
        network.rpcUrls[0] ?? CUSTOM_RPC_URL_OPTION_VALUE,
    );
    const [customRpcUrl, setCustomRpcUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [rejection, setRejection] = useState<CustomEvmNetworkRejection>();

    const isCustomRpcUrlSelected = selectedRpcValue === CUSTOM_RPC_URL_OPTION_VALUE;
    const chosenRpcUrl = isCustomRpcUrlSelected ? customRpcUrl : selectedRpcValue;
    const isChosenRpcUrlValid = validateServerAddress('evm-rpc', chosenRpcUrl);
    const customRpcUrlError =
        isCustomRpcUrlSelected && customRpcUrl && !isChosenRpcUrlValid
            ? translationString('TR_CUSTOM_BACKEND_INVALID_URL')
            : undefined;

    const onAdd = async () => {
        setIsAdding(true);
        setRejection(undefined);

        // The chosen URL leads the list, because the backend connects to the first one.
        const rpcUrls = [chosenRpcUrl, ...network.rpcUrls.filter(url => url !== chosenRpcUrl)];
        const result = await dispatch(
            addCustomEvmNetworkThunk({ definition: { ...network, rpcUrls } }),
        );

        if (addCustomEvmNetworkThunk.fulfilled.match(result)) {
            dispatch(
                notificationsActions.addToast({
                    type: 'custom-network-added',
                    networkName: network.name,
                }),
            );
            onCancel();

            return;
        }

        setRejection(result.payload ?? { error: FALLBACK_ERROR_KEY });
        setIsAdding(false);
    };

    return (
        <Modal
            width={600}
            onCancel={onCancel}
            onBackClick={onBackClick}
            heading={
                <Translation id="TR_ADD_NETWORK_HEADING" values={{ networkName: network.name }} />
            }
            data-testid="@add-custom-network/detail"
            bottomContent={
                <Modal.Button
                    onClick={onAdd}
                    isLoading={isAdding}
                    isDisabled={!isChosenRpcUrlValid}
                    data-testid="@add-custom-network/add-button"
                >
                    <Translation id="TR_ADD" />
                </Modal.Button>
            }
        >
            <Column gap={16} alignItems="stretch">
                {!isCatalogueEntryVetted(entry) && (
                    <Banner
                        intent="warning"
                        description={<Translation id="TR_CUSTOM_NETWORK_UNVERIFIED_WARNING" />}
                    />
                )}

                <Card>
                    <Column gap={16} alignItems="stretch">
                        <Row gap={12}>
                            <CustomNetworkIcon entry={entry} />
                            <Text typographyStyle="headline-sm">{network.name}</Text>
                            <CustomNetworkBadges entry={entry} />
                        </Row>

                        <Divider margin={{ top: 0, bottom: 0 }} />

                        <CustomNetworkDetailRow label={<Translation id="TR_RPC_URLS" />}>
                            <CustomNetworkRpcUrlField
                                rpcUrls={network.rpcUrls}
                                selectedValue={selectedRpcValue}
                                customUrl={customRpcUrl}
                                customUrlError={customRpcUrlError}
                                onSelectedValueChange={setSelectedRpcValue}
                                onCustomUrlChange={setCustomRpcUrl}
                            />
                        </CustomNetworkDetailRow>
                        <CustomNetworkDetailRow label={<Translation id="TR_CHAIN_ID" />}>
                            <Text typographyStyle="body-sm">{network.chainId}</Text>
                        </CustomNetworkDetailRow>
                        <CustomNetworkDetailRow label={<Translation id="TR_CURRENCY_SYMBOL" />}>
                            <Text typographyStyle="body-sm">{network.displaySymbol}</Text>
                        </CustomNetworkDetailRow>
                        <CustomNetworkDetailRow label={<Translation id="TR_CURRENCY_NAME" />}>
                            <Text typographyStyle="body-sm">{network.currencyName}</Text>
                        </CustomNetworkDetailRow>
                        <CustomNetworkDetailRow label={<Translation id="TR_BLOCK_EXPLORER_URL" />}>
                            <Text typographyStyle="body-sm" ellipsisLineCount={1}>
                                {network.explorerUrl || '–'}
                            </Text>
                        </CustomNetworkDetailRow>
                    </Column>
                </Card>

                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_CUSTOM_NETWORK_NOTE" />
                </Text>

                {rejection && (
                    <Banner
                        intent="critical"
                        data-testid="@add-custom-network/error"
                        description={
                            <Translation
                                id={
                                    isTranslationKey(rejection.error)
                                        ? rejection.error
                                        : FALLBACK_ERROR_KEY
                                }
                                values={{
                                    url: chosenRpcUrl,
                                    expected: network.chainId,
                                    actual: rejection.actualChainId ?? '–',
                                }}
                            />
                        }
                    />
                )}
            </Column>
        </Modal>
    );
};
