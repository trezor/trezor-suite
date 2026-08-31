import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { selectAccountNetworkType, selectIsPhishingTransaction } from '@suite-common/wallet-core';
import { type WalletAccountTransaction, createAccountKey } from '@suite-common/wallet-types';
import { Column, Divider } from '@trezor/components';

import { CollapsibleIOSection } from './CollapsibleIOSection';
import { IOGroup } from './IOGroup';
import { TokenSpecificBalanceDetailsRow } from './TokenSpecificBalanceDetailsRow';

type IODetailsProps = {
    tx: WalletAccountTransaction;
};

export const IODetails = ({ tx }: IODetailsProps) => {
    const accountKey = createAccountKey({
        accountDescriptor: tx.descriptor,
        networkSymbol: tx.symbol,
        deviceStaticSessionId: tx.deviceState,
    });
    const networkType = useSelector(state => selectAccountNetworkType(state, accountKey));
    const { isPhishing: isPhishingTransaction } = useSelector(state =>
        selectIsPhishingTransaction(state, tx.txid, accountKey),
    );

    const getContent = () => {
        if (networkType === 'ethereum' || networkType === 'tron') {
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
        } else if (networkType === 'solana' || networkType === 'stellar') {
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
        } else if (networkType === 'cardano') {
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
