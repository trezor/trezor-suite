import { useState } from 'react';

import { Network } from '@suite-common/wallet-config';
import {
    DefinitionType,
    tokenDefinitionsActions,
    TokenManagementAction,
    EnhancedTokenInfo,
} from '@suite-common/token-definitions';
import { Badge, Button, Dropdown, Icon, Row, Table, Text, IconCircle } from '@trezor/components';
import { SelectedAccountStatus } from '@suite-common/wallet-types';
import { getNftExplorerUrl, getNftContractExplorerUrl } from '@suite-common/wallet-utils';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import {
    HiddenPlaceholder,
    RedactNumericalValue,
    Translation,
    TrezorLink,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { SUITE } from 'src/actions/suite/constants';
import { selectIsCopyAddressModalShown } from 'src/reducers/suite/suiteReducer';
import { copyAddressToClipboard, showCopyAddressModal } from 'src/actions/suite/copyAddressActions';

import { BlurUrls } from '../../tokens/common/BlurUrls';
import { DropdownRow } from '../../tokens/DropdownRow';

type NftsRowProps = {
    nft: EnhancedTokenInfo;
    network: Network;
    selectedAccount: SelectedAccountStatus;
    isShown?: boolean;
    isEmptyCollection?: boolean;
    setIsEmptyCollectionsOpen?: (open: boolean) => void;
    isEmptyCollectionsOpen?: boolean;
};

const NftsRow = ({
    nft,
    network,
    isShown,
    selectedAccount,
    isEmptyCollection = false,
    isEmptyCollectionsOpen = false,
}: NftsRowProps) => {
    const dispatch = useDispatch();
    const [isCollectionOpen, setIsCollectionOpen] = useState(false);
    const shouldShowCopyAddressModal = useSelector(selectIsCopyAddressModalShown);
    const { account } = selectedAccount;
    const nftItemsCount = nft.ids?.length || nft.multiTokenValues?.length || 0;
    const NftName = <BlurUrls text={nft.name} />;

    return (
        <>
            <Table.Row
                onClick={
                    isEmptyCollection ? undefined : () => setIsCollectionOpen(!isCollectionOpen)
                }
                isCollapsed={isEmptyCollection && !isEmptyCollectionsOpen}
                isHighlightedOnHover={!isEmptyCollection}
            >
                <Table.Cell colSpan={1}>
                    <DropdownRow
                        isActive={isCollectionOpen}
                        typographyStyle="body"
                        variant="default"
                        nftName={NftName}
                        nftItemsCount={!isEmptyCollection ? nftItemsCount : undefined}
                        shouldDisplayIcon={!isEmptyCollection}
                    />
                </Table.Cell>
                <Table.Cell colSpan={1} align="right">
                    <Row gap={spacings.xs}>
                        <Dropdown
                            alignMenu="bottom-right"
                            items={[
                                {
                                    key: 'export',
                                    options: [
                                        {
                                            label: <Translation id="TR_HIDE_COLLECTION" />,
                                            icon: 'hide',
                                            onClick: () =>
                                                dispatch(
                                                    tokenDefinitionsActions.setTokenStatus({
                                                        symbol: network.symbol,
                                                        contractAddress: nft.contract || '',
                                                        status: TokenManagementAction.HIDE,
                                                        type: DefinitionType.NFT,
                                                    }),
                                                ),
                                            isHidden: !isShown,
                                        },
                                        {
                                            label: <Translation id="TR_VIEW_ALL_TRANSACTION" />,
                                            icon: 'newspaper',
                                            onClick: () => {
                                                dispatch({
                                                    type: SUITE.SET_TRANSACTION_HISTORY_PREFILL,
                                                    payload: nft.contract || '',
                                                });
                                                if (account) {
                                                    dispatch(
                                                        goto('wallet-index', {
                                                            params: {
                                                                symbol: account.symbol,
                                                                accountIndex: account.index,
                                                                accountType: account.accountType,
                                                            },
                                                        }),
                                                    );
                                                }
                                            },
                                        },
                                        {
                                            label: <Translation id="TR_VIEW_IN_EXPLORER" />,
                                            icon: 'arrowUpRight',
                                            onClick: () => {
                                                window.open(
                                                    getNftContractExplorerUrl(network, nft),
                                                    '_blank',
                                                );
                                            },
                                        },
                                    ],
                                },
                                {
                                    key: 'contract-address',
                                    label: <Translation id="TR_CONTRACT_ADDRESS" />,
                                    options: [
                                        {
                                            label: (
                                                <Row gap={spacings.xxs}>
                                                    {nft.contract}
                                                    <Icon name="copy" size={14} />
                                                </Row>
                                            ),
                                            onClick: () => {
                                                dispatch(
                                                    shouldShowCopyAddressModal
                                                        ? showCopyAddressModal(
                                                              nft.contract || '',
                                                              'contract',
                                                          )
                                                        : copyAddressToClipboard(nft.contract),
                                                );
                                            },
                                        },
                                    ],
                                },
                            ]}
                        />
                        {!isShown && (
                            <Button
                                icon="show"
                                onClick={() => {
                                    dispatch(
                                        tokenDefinitionsActions.setTokenStatus({
                                            symbol: network.symbol,
                                            contractAddress: nft.contract || '',
                                            status: TokenManagementAction.SHOW,
                                            type: DefinitionType.NFT,
                                        }),
                                    );
                                }}
                                variant="tertiary"
                                size="small"
                            >
                                <Translation id="TR_UNHIDE" />
                            </Button>
                        )}
                    </Row>
                </Table.Cell>
            </Table.Row>
            {['ERC721', 'BEP721'].includes(nft.type) &&
                nft.ids?.map((id, index) => (
                    <Table.Row
                        key={`${id}-${index}`}
                        isCollapsed={!isCollectionOpen}
                        isHighlightedOnHover={false}
                    >
                        <Table.Cell colSpan={2}>
                            <Text typographyStyle="hint">
                                <HiddenPlaceholder>
                                    <Row gap={spacings.xs}>
                                        <IconCircle
                                            name="pictureFrame"
                                            paddingType="large"
                                            size={28}
                                            variant="tertiary"
                                        />
                                        <Text textWrap="nowrap">{NftName}</Text>
                                        #<RedactNumericalValue value={id} />
                                        <Badge size="small">
                                            <RedactNumericalValue value="1x" />
                                        </Badge>
                                        <TrezorLink
                                            typographyStyle="label"
                                            variant="nostyle"
                                            href={getNftExplorerUrl(network, nft, id)}
                                            target="_blank"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <Icon name="arrowUpRight" size={12} />
                                        </TrezorLink>
                                    </Row>
                                </HiddenPlaceholder>
                            </Text>
                        </Table.Cell>
                    </Table.Row>
                ))}
            {['ERC1155', 'BEP1155'].includes(nft.type) &&
                nft.multiTokenValues?.map((value, index) => (
                    <Table.Row
                        key={`${nft.contract}-${index}`}
                        isCollapsed={!isCollectionOpen}
                        isHighlightedOnHover={false}
                    >
                        <Table.Cell colSpan={2}>
                            <Text typographyStyle="hint">
                                <HiddenPlaceholder>
                                    <Row gap={spacings.xs}>
                                        <IconCircle
                                            name="pictureFrame"
                                            paddingType="large"
                                            size={28}
                                            variant="tertiary"
                                        />
                                        <Text textWrap="nowrap">{NftName}</Text>
                                        #<RedactNumericalValue value={value.id || ''} />
                                        <Badge size="small">
                                            <RedactNumericalValue value={value.value || ''} />x
                                        </Badge>
                                        <TrezorLink
                                            typographyStyle="label"
                                            variant="nostyle"
                                            href={getNftExplorerUrl(network, nft, value?.id || '')}
                                            target="_blank"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <Icon name="arrowUpRight" size={12} />
                                        </TrezorLink>
                                    </Row>
                                </HiddenPlaceholder>
                            </Text>
                        </Table.Cell>
                    </Table.Row>
                ))}
        </>
    );
};

export default NftsRow;
