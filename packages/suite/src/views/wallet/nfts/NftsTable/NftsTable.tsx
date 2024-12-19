import { useState } from 'react';

import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Card, Column, Table } from '@trezor/components';
import { getNetwork } from '@suite-common/wallet-config';
import { spacings } from '@trezor/theme';

import { GetTokensOutputType } from 'src/utils/wallet/tokenUtils';
import { Translation } from 'src/components/suite/Translation';

import NftsRow from './NftsRow';
import { DropdownRow } from '../../tokens/DropdownRow';

type NftsTableProps = {
    selectedAccount: SelectedAccountLoaded;
    isShown?: boolean;
    verified?: boolean;
    nfts: GetTokensOutputType;
};

const NftsTable = ({ selectedAccount, isShown, verified, nfts }: NftsTableProps) => {
    const { account } = selectedAccount;
    const network = getNetwork(account.symbol);
    const [isEmptyCollectionsOpen, setIsEmptyCollectionsOpen] = useState(false);

    const getNftsToShow = () => {
        if (isShown) {
            return nfts.shownWithBalance;
        }

        return verified ? nfts.hiddenWithBalance : nfts.unverifiedWithBalance;
    };

    const getNftsWithoutBalance = () => {
        if (isShown) {
            return nfts.shownWithoutBalance;
        }

        return verified ? nfts.hiddenWithoutBalance : nfts.unverifiedWithoutBalance;
    };

    const nftsToShow = getNftsToShow();
    const nftsWithoutBalance = getNftsWithoutBalance();

    return nftsToShow.length > 0 || nftsWithoutBalance.length > 0 ? (
        <Column width="100%" alignItems="start" gap={12}>
            <Card paddingType="none" overflow="hidden">
                <Table
                    margin={{ top: spacings.xs }}
                    colWidths={[
                        { minWidth: '200px', maxWidth: '250px' },
                        { minWidth: '100px', maxWidth: '250px' },
                        { minWidth: '100px', maxWidth: '250px' },
                    ]}
                    isRowHighlightedOnHover
                >
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell colSpan={2}>
                                <Translation id="TR_COLLECTIONS" />
                            </Table.Cell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {nftsToShow.map(nft => (
                            <NftsRow
                                nft={nft}
                                key={nft.contract}
                                network={network}
                                isShown={isShown}
                                selectedAccount={selectedAccount}
                            />
                        ))}
                        {nftsWithoutBalance.length !== 0 && (
                            <>
                                <Table.Row
                                    onClick={() =>
                                        setIsEmptyCollectionsOpen(!isEmptyCollectionsOpen)
                                    }
                                >
                                    <Table.Cell colSpan={2}>
                                        <DropdownRow
                                            isActive={isEmptyCollectionsOpen}
                                            text="EMPTY_NFT_COLLECTIONS"
                                            typographyStyle="hint"
                                            variant="tertiary"
                                        />
                                    </Table.Cell>
                                </Table.Row>
                                {nftsWithoutBalance.map(nft => (
                                    <NftsRow
                                        key={nft.contract}
                                        nft={nft}
                                        network={network}
                                        isShown={isShown}
                                        selectedAccount={selectedAccount}
                                        isEmptyCollection={true}
                                        isEmptyCollectionsOpen={isEmptyCollectionsOpen}
                                    />
                                ))}
                            </>
                        )}
                    </Table.Body>
                </Table>
            </Card>
        </Column>
    ) : null;
};

export default NftsTable;
