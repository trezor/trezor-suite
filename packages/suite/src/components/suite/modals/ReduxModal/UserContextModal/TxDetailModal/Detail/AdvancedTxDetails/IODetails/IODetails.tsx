import { Translation } from '@suite/intl';
import { selectIsPhishingTransaction } from '@suite-common/wallet-core';
import { type WalletAccountTransaction, createAccountKey } from '@suite-common/wallet-types';
import { Column, Divider } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite/useSelector';

import { AnalyzeInExplorerBanner } from './AnalyzeInExplorerBanner';
import { CollapsibleIOSection } from './CollapsibleIOSection';
import { IOGroup } from './IOGroup';
import { TokenSpecificBalanceDetailsRow } from './TokenSpecificBalanceDetailsRow';

type IODetailsProps = {
    tx: WalletAccountTransaction;
};

// Not ready for Cardano tokens because they are utxo based
export const IODetails = ({ tx }: IODetailsProps) => {
    const network = useSelector(state => state.wallet.selectedAccount.network);
    const accountKey = createAccountKey({
        accountDescriptor: tx.descriptor,
        networkSymbol: tx.symbol,
        deviceStaticSessionId: tx.deviceState,
    });
    const { isPhishing: isPhishingTransaction } = useSelector(state =>
        selectIsPhishingTransaction(state, tx.txid, accountKey),
    );

    const getContent = () => {
        if (network?.networkType === 'ethereum' || network?.networkType === 'tron') {
            return (
                <>
                    <IOGroup
                        inputs={tx.details.vin}
                        outputs={tx.details.vout}
                        tx={tx}
                        isPhishingTransaction={isPhishingTransaction}
                    />
                    <TokenSpecificBalanceDetailsRow
                        tx={tx}
                        isPhishingTransaction={isPhishingTransaction}
                    />
                </>
            );
        } else if (network?.networkType === 'solana' || network?.networkType === 'stellar') {
            return (
                <>
                    <IOGroup
                        tx={tx}
                        inputs={tx.details.vin}
                        outputs={tx.details.vout.length ? tx.details.vout : tx.targets}
                        isPhishingTransaction={isPhishingTransaction}
                    />
                    <TokenSpecificBalanceDetailsRow
                        tx={tx}
                        isPhishingTransaction={isPhishingTransaction}
                    />
                </>
            );
        } else if (tx.type === 'joint') {
            return (
                <>
                    <CollapsibleIOSection
                        heading={<Translation id="TR_MY_INPUTS_AND_OUTPUTS" />}
                        opened
                        tx={tx}
                        inputs={tx.details.vin?.filter(vin => vin.isAccountOwned)}
                        outputs={tx.details.vout?.filter(vout => vout.isAccountOwned)}
                        isPhishingTransaction={isPhishingTransaction}
                    />
                    <Divider margin={{ top: spacings.xs, bottom: spacings.xxs }} />
                    <CollapsibleIOSection
                        heading={<Translation id="TR_OTHER_INPUTS_AND_OUTPUTS" />}
                        tx={tx}
                        inputs={tx.details.vin?.filter(vin => !vin.isAccountOwned)}
                        outputs={tx.details.vout?.filter(vout => !vout.isAccountOwned)}
                        isPhishingTransaction={isPhishingTransaction}
                    />
                </>
            );
        } else {
            return (
                <IOGroup
                    tx={tx}
                    inputs={tx.details.vin}
                    outputs={tx.details.vout}
                    isUtxoBased
                    isPhishingTransaction={isPhishingTransaction}
                />
            );
        }
    };

    return (
        <Column gap={24}>
            <AnalyzeInExplorerBanner txid={tx.txid} symbol={tx.symbol} />
            <Column gap={20}>{getContent()}</Column>
        </Column>
    );
};
