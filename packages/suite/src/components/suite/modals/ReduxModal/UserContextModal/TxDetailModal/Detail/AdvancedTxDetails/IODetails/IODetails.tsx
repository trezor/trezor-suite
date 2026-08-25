import { Translation } from '@suite/intl';
import { getNetwork } from '@suite-common/wallet-config';
import { selectIsPhishingTransaction } from '@suite-common/wallet-core';
import { type WalletAccountTransaction, createAccountKey } from '@suite-common/wallet-types';
import { Column, Divider } from '@trezor/components';

import { useSelector } from 'src/hooks/suite/useSelector';

import { CollapsibleIOSection } from './CollapsibleIOSection';
import { IOGroup } from './IOGroup';
import { TokenSpecificBalanceDetailsRow } from './TokenSpecificBalanceDetailsRow';

type IODetailsProps = {
    tx: WalletAccountTransaction;
};

export const IODetails = ({ tx }: IODetailsProps) => {
    // The transaction's own network, which is not necessarily the one of the selected account: the
    // transaction detail is opened from places such as the trade history as well.
    const network = getNetwork(tx.symbol);
    const accountKey = createAccountKey({
        accountDescriptor: tx.descriptor,
        networkSymbol: tx.symbol,
        deviceStaticSessionId: tx.deviceState,
    });
    const { isPhishing: isPhishingTransaction } = useSelector(state =>
        selectIsPhishingTransaction(state, tx.txid, accountKey),
    );

    const getContent = () => {
        if (network.networkType === 'ethereum' || network.networkType === 'tron') {
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
        } else if (network.networkType === 'solana' || network.networkType === 'stellar') {
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
                    <Divider margin={{ top: 8, bottom: 4 }} />
                    <CollapsibleIOSection
                        heading={<Translation id="TR_OTHER_INPUTS_AND_OUTPUTS" />}
                        tx={tx}
                        inputs={tx.details.vin?.filter(vin => !vin.isAccountOwned)}
                        outputs={tx.details.vout?.filter(vout => !vout.isAccountOwned)}
                        isPhishingTransaction={isPhishingTransaction}
                    />
                </>
            );
        } else if (network.networkType === 'cardano') {
            return (
                <>
                    <IOGroup
                        tx={tx}
                        inputs={tx.details.vin}
                        outputs={tx.details.vout}
                        isUtxoBased
                        isPhishingTransaction={isPhishingTransaction}
                    />
                    <TokenSpecificBalanceDetailsRow
                        tx={tx}
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

    return <Column gap={20}>{getContent()}</Column>;
};
