import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Card, Column, Table } from '@trezor/components';
import { getNetwork } from '@suite-common/wallet-config';
import { spacings } from '@trezor/theme';

import { GetTokensOutputType } from 'src/utils/wallet/tokenUtils';
import { Translation } from 'src/components/suite/Translation';

import NftsRow from './NftsRow';

type NftsTableProps = {
    selectedAccount: SelectedAccountLoaded;
    isShown?: boolean;
    verified?: boolean;
    nfts: GetTokensOutputType;
};

const NftsTable = ({ selectedAccount, isShown, verified, nfts }: NftsTableProps) => {
    const { account } = selectedAccount;
    const network = getNetwork(account.symbol);

    const getNftsToShow = () => {
        if (isShown) {
            return [...nfts.shownWithBalance, ...nfts.shownWithoutBalance];
        }

        return verified
            ? [...nfts.hiddenWithBalance, ...nfts.hiddenWithoutBalance]
            : [...nfts.unverifiedWithBalance, ...nfts.unverifiedWithoutBalance];
    };

    const nftsToShow = getNftsToShow();

    return nftsToShow.length > 0 ? (
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
                            <Table.Cell colSpan={1}>
                                <Translation id="TR_COLLECTION_NAME" />
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
                    </Table.Body>
                </Table>
            </Card>
        </Column>
    ) : null;
};

export default NftsTable;
