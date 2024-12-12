import { Banner, H3, Column } from '@trezor/components';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { selectNftDefinitions } from '@suite-common/token-definitions';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { getTokens } from 'src/utils/wallet/tokenUtils';

import { NoTokens } from '../tokens/common/NoTokens';
import NftsTable from './NftsTable/NftsTable';

type EvmNftsTablesProps = {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
    isShown: boolean;
};

export const NftsTablesSection = ({
    selectedAccount,
    searchQuery,
    isShown = true,
}: EvmNftsTablesProps) => {
    const nftDefinitions = useSelector(state =>
        selectNftDefinitions(state, selectedAccount.account.symbol),
    );
    const nfts = getTokens({
        tokens: selectedAccount.account.tokens || [],
        symbol: selectedAccount.account.symbol,
        tokenDefinitions: nftDefinitions,
        isNft: true,
        searchQuery,
    });

    const areNoShownNfts = !nfts?.shownWithBalance.length && !nfts?.shownWithoutBalance.length;

    const areNoHiddenNfts = !nfts?.hiddenWithBalance.length && !nfts?.hiddenWithoutBalance.length;

    const areNoUnverifiedNfts =
        !nfts?.unverifiedWithBalance.length && !nfts?.unverifiedWithoutBalance.length;

    const hiddenEvmNfts = (
        <Column gap={spacings.xl}>
            <NftsTable
                selectedAccount={selectedAccount}
                isShown={false}
                verified={true}
                nfts={nfts}
            />
            <H3>
                <Translation id="TR_COLLECTIONS_UNRECOGNIZED_BY_TREZOR" />
            </H3>
            <Banner variant="warning" icon>
                <Translation id="TR_NFT_UNRECOGNIZED_BY_TREZOR_TOOLTIP" />
            </Banner>
            <NftsTable
                selectedAccount={selectedAccount}
                isShown={false}
                verified={false}
                nfts={nfts}
            />
        </Column>
    );

    const getNoTokensTitle = () => {
        const hasHiddenOrUnverified =
            nfts?.hiddenWithBalance.length ||
            nfts?.hiddenWithoutBalance.length ||
            nfts?.unverifiedWithBalance.length ||
            nfts?.unverifiedWithoutBalance.length;

        return hasHiddenOrUnverified ? 'TR_NFT_EMPTY_CHECK_HIDDEN' : 'TR_NFT_EMPTY';
    };

    if (isShown) {
        return areNoShownNfts ? (
            <NoTokens isNft={true} title={<Translation id={getNoTokensTitle()} />} />
        ) : (
            <NftsTable selectedAccount={selectedAccount} isShown={isShown} verified nfts={nfts} />
        );
    }

    if (areNoHiddenNfts && areNoUnverifiedNfts) {
        return <NoTokens isNft={true} title={<Translation id="TR_HIDDEN_NFT_EMPTY" />} />;
    }

    return hiddenEvmNfts;
};
