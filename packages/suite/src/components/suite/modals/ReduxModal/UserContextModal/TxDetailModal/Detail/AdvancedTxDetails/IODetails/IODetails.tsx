import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Column, Divider } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';

import { AnalyzeInExplorerBanner } from './AnalyzeInExplorerBanner';
import { CollapsibleIOSection } from './CollapsibleIOSection';
import { IOGroup } from './IOGroup';
import { TokenSpecificBalanceDetailsRow } from './TokenSpecificBalanceDetailsRow';

export type IODetails = WalletAccountTransaction['details']['vin'][number];

type IODetailsProps = {
    tx: WalletAccountTransaction;
    isPhishingTransaction: boolean;
};

// Not ready for Cardano tokens, they will not be visible, probably
export const IODetails = ({ tx, isPhishingTransaction }: IODetailsProps) => {
    const network = useSelector(state => state.wallet.selectedAccount.network);

    const getContent = () => {
        if (network?.networkType === 'ethereum') {
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
        } else if (network?.networkType === 'solana') {
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
                    />
                    <Divider margin={{ top: spacings.xs, bottom: spacings.xxs }} />
                    <CollapsibleIOSection
                        heading={<Translation id="TR_OTHER_INPUTS_AND_OUTPUTS" />}
                        tx={tx}
                        inputs={tx.details.vin?.filter(vin => !vin.isAccountOwned)}
                        outputs={tx.details.vout?.filter(vout => !vout.isAccountOwned)}
                    />
                </>
            );
        } else {
            return (
                <IOGroup tx={tx} inputs={tx.details.vin} outputs={tx.details.vout} isUtxoBased />
            );
        }
    };

    return (
        <Column gap={spacings.xxl}>
            <AnalyzeInExplorerBanner txid={tx.txid} symbol={tx.symbol} />
            <Column gap={spacings.lg}>{getContent()}</Column>
        </Column>
    );
};
