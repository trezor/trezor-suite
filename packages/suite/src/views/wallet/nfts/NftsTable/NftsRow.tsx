import { useState } from 'react';

import { Address, copyAddressToClipboard, showCopyAddressModal } from '@suite/address';
import { RedactNumericalValue } from '@suite/discreet-mode';
import { selectIsCopyAddressModalShown } from '@suite/flags';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import {
    DefinitionType,
    type TokenInfo,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { type Explorer, type Network } from '@suite-common/wallet-config';
import { selectExplorer } from '@suite-common/wallet-core';
import { type SelectedAccountStatus } from '@suite-common/wallet-types';
import {
    NFT_MULTITOKEN_STANDARDS,
    NFT_SINGLETOKEN_STANDARDS,
    getNftContractExplorerUrl,
    getNftExplorerUrl,
} from '@suite-common/wallet-utils';
import {
    Badge,
    Button,
    Card,
    Column,
    Dropdown,
    IconCircle,
    InfoItem,
    Link,
    Row,
    Table,
    Text,
} from '@trezor/components';
import {
    ArrowUpRightIcon,
    EyeIcon,
    EyeSlashIcon,
    NewspaperIcon,
    PictureFrameIcon,
} from '@trezor/icons';

import { setTransactionHistoryPrefill } from 'src/actions/suite/suiteActions';
import { HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { getTokenAddressTranslationId } from 'src/utils/wallet/tokenUtils';

import { DropdownRow } from '../../tokens/DropdownRow';
import { BlurUrls } from '../../tokens/common/BlurUrls';

type NftsRowProps = {
    nft: TokenInfo;
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
    const explorer = useSelector(state => selectExplorer(state, network.symbol)) as Explorer;
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
                        typographyStyle="body-md"
                        intent="neutral"
                        nftName={NftName}
                        nftItemsCount={!isEmptyCollection ? nftItemsCount : undefined}
                        shouldDisplayIcon={!isEmptyCollection}
                    />
                </Table.Cell>
                <Table.Cell colSpan={1} align="end">
                    <Row gap={8}>
                        <Dropdown
                            placement={{ position: 'bottom', alignment: 'start' }}
                            tooltip={{
                                content: <Translation id="TR_SHOW_MORE" />,
                                placement: 'left',
                            }}
                            content={
                                <Card paddingType="small">
                                    <Column gap={16}>
                                        <InfoItem
                                            typographyStyle="body-xs"
                                            label={
                                                <Translation
                                                    id={getTokenAddressTranslationId(
                                                        network.networkType,
                                                    )}
                                                />
                                            }
                                            gap={0}
                                        >
                                            <Link href={getNftContractExplorerUrl(explorer, nft)}>
                                                <Address
                                                    typographyStyle="body-xs"
                                                    isTruncated
                                                    value={nft.contract}
                                                    isCopyAllowed
                                                    onCopy={() => {
                                                        dispatch(
                                                            shouldShowCopyAddressModal
                                                                ? showCopyAddressModal(
                                                                      nft.contract || '',
                                                                      'contract',
                                                                  )
                                                                : copyAddressToClipboard(
                                                                      nft.contract,
                                                                  ),
                                                        );
                                                    }}
                                                />
                                            </Link>
                                        </InfoItem>
                                    </Column>
                                </Card>
                            }
                            items={[
                                {
                                    label: <Translation id="TR_HIDE_COLLECTION" />,
                                    icon: EyeSlashIcon,
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
                                    icon: NewspaperIcon,
                                    onClick: () => {
                                        dispatch(setTransactionHistoryPrefill(nft.contract || ''));
                                        if (account) {
                                            dispatch(
                                                gotoThunk({
                                                    routeName: 'wallet-index',
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
                                    icon: ArrowUpRightIcon,
                                    onClick: () => {
                                        window.open(
                                            getNftContractExplorerUrl(explorer, nft),
                                            '_blank',
                                        );
                                    },
                                },
                            ]}
                        />
                        {!isShown && (
                            <Button
                                iconLeft={EyeIcon}
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
                                intent="neutral"
                                priority="secondary"
                            >
                                <Translation id="TR_UNHIDE" />
                            </Button>
                        )}
                    </Row>
                </Table.Cell>
            </Table.Row>
            {NFT_SINGLETOKEN_STANDARDS.has(nft.standard) &&
                nft.ids?.map((id, index) => (
                    <Table.Row
                        key={`${id}-${index}`}
                        isCollapsed={!isCollectionOpen}
                        isHighlightedOnHover={false}
                    >
                        <Table.Cell colSpan={2}>
                            <Text typographyStyle="body-sm">
                                <HiddenPlaceholder>
                                    <Row gap={8}>
                                        <IconCircle
                                            icon={PictureFrameIcon}
                                            size={32}
                                            intent="neutral"
                                        />
                                        <Link href={getNftExplorerUrl(explorer, nft, id)}>
                                            <Text textWrap="nowrap">{NftName}</Text>
                                        </Link>
                                        <Text>
                                            #<RedactNumericalValue value={id} />
                                        </Text>
                                        <Badge size="small">
                                            <RedactNumericalValue value="1x" />
                                        </Badge>
                                    </Row>
                                </HiddenPlaceholder>
                            </Text>
                        </Table.Cell>
                    </Table.Row>
                ))}
            {NFT_MULTITOKEN_STANDARDS.has(nft.standard) &&
                nft.multiTokenValues?.map((value, index) => (
                    <Table.Row
                        key={`${nft.contract}-${index}`}
                        isCollapsed={!isCollectionOpen}
                        isHighlightedOnHover={false}
                    >
                        <Table.Cell colSpan={2}>
                            <Text typographyStyle="body-sm">
                                <HiddenPlaceholder>
                                    <Row gap={8}>
                                        <IconCircle
                                            icon={PictureFrameIcon}
                                            size={32}
                                            intent="neutral"
                                        />
                                        <Link
                                            href={getNftExplorerUrl(explorer, nft, value?.id || '')}
                                        >
                                            <Text textWrap="nowrap">{NftName}</Text>
                                        </Link>
                                        <Text>
                                            #<RedactNumericalValue value={value.id || ''} />
                                        </Text>
                                        <Badge size="small">
                                            <RedactNumericalValue value={value.value || ''} />x
                                        </Badge>
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
