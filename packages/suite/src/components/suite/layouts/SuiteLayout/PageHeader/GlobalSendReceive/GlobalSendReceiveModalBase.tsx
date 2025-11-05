import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { Box, Column, ElevationContext, Modal, Row } from '@trezor/components';
import { SearchAsset } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { useAccountSearch, useSelector, useTranslation } from 'src/hooks/suite';
import { AccountItemType } from 'src/types/wallet';

import { AccountList } from './AccountList';

type GlobalSendReceiveModalBaseProps = {
    heading?: React.ReactNode;
    onCancel: (filledSearch: boolean) => void;
    onSubmit: (account: Account, type: AccountItemType, filledSearch: boolean) => void;
    additionalAction?: React.ReactNode;
};

export const GlobalSendReceiveModalBase = ({
    heading,
    onCancel,
    onSubmit,
    additionalAction,
}: GlobalSendReceiveModalBaseProps) => {
    const { searchString, setSearchString, selectedNetwork, setSelectedNetwork } =
        useAccountSearch();
    const { translationString } = useTranslation();
    const enabledNetworksSymbol = useSelector(selectEnabledNetworks);

    return (
        <Modal heading={heading} onCancel={() => onCancel(!!searchString)} size="small">
            <Column height={500} gap={spacings.sm}>
                <Row gap={spacings.xs}>
                    <Box flex="1">
                        <SearchAsset
                            searchPlaceholder={translationString('TR_SEARCH')}
                            search={searchString ?? ''}
                            setSearch={setSearchString}
                            selectConfig={{
                                networks: enabledNetworksSymbol,
                                selectedNetwork,
                                onChange: setSelectedNetwork,
                                includeAllOption: true,
                                allLabel: translationString('TR_ALL_NETWORKS', {
                                    networkCount: enabledNetworksSymbol.length,
                                }),
                            }}
                        />
                    </Box>
                    {additionalAction}
                </Row>
                <ElevationContext baseElevation={-1}>
                    <AccountList
                        hideStaking
                        onSubmit={(account, type) => onSubmit(account, type, !!searchString)}
                    />
                </ElevationContext>
            </Column>
        </Modal>
    );
};
