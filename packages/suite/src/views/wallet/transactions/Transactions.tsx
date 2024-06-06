import { ReactNode } from 'react';

import { WalletLayout, CoinjoinAccountDiscoveryProgress } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { AppState } from 'src/types/suite';
import { selectAccountTransactions, selectIsLoadingTransactions } from '@suite-common/wallet-core';
import { NoTransactions } from './components/NoTransactions';
import { AccountEmpty } from './components/AccountEmpty';
import { TransactionList } from './TransactionList/TransactionList';
import { TransactionSummary } from './components/TransactionSummary';
import { CoinjoinExplanation } from './CoinjoinExplanation/CoinjoinExplanation';
import { CoinjoinSummary } from './CoinjoinSummary/CoinjoinSummary';
import { TradeBox } from './TradeBox/TradeBox';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { WalletAccountTransaction } from '@suite-common/wallet-types';

const AccountLayout = styled(WalletLayout)`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxl};
`;

interface LayoutProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    children?: ReactNode;
    showEmptyHeaderPlaceholder?: boolean;
}

const Layout = ({ selectedAccount, showEmptyHeaderPlaceholder = false, children }: LayoutProps) => (
    <AccountLayout
        title="TR_NAV_TRANSACTIONS"
        account={selectedAccount}
        showEmptyHeaderPlaceholder={showEmptyHeaderPlaceholder}
    >
        {children}
    </AccountLayout>
);

export const Transactions = () => {
    const transactionsIsLoading = useSelector(selectIsLoadingTransactions);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const accountTransactions = useSelector(state =>
        selectAccountTransactions(state, selectedAccount.account?.key || ''),
    );

    if (selectedAccount.status !== 'loaded') {
        return <Layout selectedAccount={selectedAccount} />;
    }

    const { account } = selectedAccount;

    if (account.backendType === 'coinjoin') {
        const isLoading = account.status === 'out-of-sync' && !!account.syncing;
        const isEmpty = !accountTransactions.length;

        return (
            <Layout selectedAccount={selectedAccount}>
                {isLoading && <CoinjoinAccountDiscoveryProgress />}

                {!isLoading && (
                    <>
                        <CoinjoinSummary accountKey={account.key} />

                        {isEmpty ? (
                            <CoinjoinExplanation />
                        ) : (
                            <TransactionList
                                account={account}
                                transactions={accountTransactions}
                                symbol={account.symbol}
                                isLoading={transactionsIsLoading}
                            />
                        )}
                    </>
                )}
            </Layout>
        );
    }

    // TODO REVERT THIS COMMIT
    const accountTransactionsMock = [
        // confirmed 8.6.2024 (I've made it disorganized on purpose, to show that pending txs are extracted and sorted first
        {
            descriptor:
                'vpub5Z1mwnhobbM2CXU9QH39CxRp4CfCZ1FaYXxgn4L8Fhehd4GLuqgXW47MaNNiW85Qw34qEoUn2C9dNouDEGCDjz5nGYrzamqa91zzx2ERJjx',
            deviceState: 'n1ooH7an9edJDSRcciBxu6ecELknHVTS6S@FA3F661CA7DE70F5CF2170AD:1',
            symbol: 'test',
            type: 'recv',
            txid: '97306300a334cc53412cd12b29dc5f4eb24384eada69ad3be6127cf947cf9c99',
            blockTime: 1717680170 + 173000,
            blockHeight: 2820252 + 100,
            blockHash: '000000008e648f47672ea1b2f444971652d663e2816a93e07ed439a765aa76c0',
            lockTime: 2820159,
            amount: '4000',
            fee: '200988',
            vsize: 196,
            feeRate: '1025.45',
            targets: [
                {
                    n: 0,
                    addresses: ['tb1qt9juh0yeszxq686xmxgdrmrmxcuy02ugugw572'],
                    isAddress: true,
                    amount: '4000',
                    isAccountTarget: true,
                },
            ],
            tokens: [],
            internalTransfers: [],
            rbf: true,
            details: {
                vin: [
                    {
                        txid: '9def45c8cc8bcfd58735ee0221f091b1a68493497695eab4752bf76d84dacb2c',
                        sequence: 4294967293,
                        n: 0,
                        addresses: ['tb1qsh0xrq7ew469q39lc45r965t6hf8dvc3vlhg8c'],
                        isAddress: true,
                        value: '739157853',
                    },
                ],
                vout: [
                    {
                        value: '4000',
                        n: 0,
                        hex: '00145965cbbc99808c0d1f46d990d1ec7b363847ab88',
                        addresses: ['tb1qt9juh0yeszxq686xmxgdrmrmxcuy02ugugw572'],
                        isAddress: true,
                        isOwn: true,
                        isAccountOwned: true,
                    },
                    {
                        value: '3990',
                        n: 1,
                        hex: '512059a19c83b55328b59828073982ddd080a41b9078ce40057f900090ed7a8541c0',
                        addresses: [
                            'tb1ptxseeqa42v5ttxpgquuc9hwsszjphyrceeqq2lusqzgw6759g8qqezz8x9',
                        ],
                        isAddress: true,
                    },
                    {
                        value: '738948875',
                        n: 2,
                        hex: '5120b2988546a8e785f31f9577d6501d6c2a701d43297dc1a8836a0760bf9d2d036f',
                        addresses: [
                            'tb1pk2vg234gu7zlx8u4wlt9q8tv9fcp6sef0hq63qm2qastl8fdqdhsmuqtav',
                        ],
                        isAddress: true,
                    },
                ],
                size: 277,
                totalInput: '739157853',
                totalOutput: '738956865',
            },
        },
        // pending 6.6.2024
        {
            descriptor:
                'vpub5Z1mwnhobbM2CXU9QH39CxRp4CfCZ1FaYXxgn4L8Fhehd4GLuqgXW47MaNNiW85Qw34qEoUn2C9dNouDEGCDjz5nGYrzamqa91zzx2ERJjx',
            deviceState: 'n1ooH7an9edJDSRcciBxu6ecELknHVTS6S@FA3F661CA7DE70F5CF2170AD:1',
            symbol: 'test',
            type: 'sent',
            txid: '63462b8fa1a74109f03f10d5f9b13c02e5ed1a12afe5bea1e7d7d01a9e775799',
            hex: '01000000000101879ccf47f97c12e63bad69daea8443b24e5fdc292bd12c4153cc34a3006330970000000000fdffffff025802000000000000160014fcb55e6920e2c6f37327a5bf4a24cf42ebbaf07cbb0c000000000000160014cc85e201189d5c0e1ef8e9506c7e2313b93c5a8d02483045022100d5f0a477948d61cee10b081b7c898d0d5df6718b53b4f1ccf0fdedf852d4f22f02204fc8d970f5eb7c6df4b2a83b2375b29af7527531e416755aff5c9a7d5c21017e012103e06e169912635e46bff9ffa167b32e6f42530254068608049191893d47f5dc2d00000000',
            blockTime: 1717673572,
            blockHeight: 0,
            amount: '600',
            fee: '141',
            vsize: 141,
            feeRate: '1',
            targets: [
                {
                    n: 0,
                    addresses: ['tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q'],
                    isAddress: true,
                    amount: '600',
                },
            ],
            tokens: [],
            internalTransfers: [],
            rbf: true,
            details: {
                vin: [
                    {
                        n: 0,
                        txid: '97306300a334cc53412cd12b29dc5f4eb24384eada69ad3be6127cf947cf9c87',
                        vout: 0,
                        isAddress: true,
                        addresses: ['tb1qt9juh0yeszxq686xmxgdrmrmxcuy02ugugw572'],
                        value: '4000',
                        sequence: 4294967293,
                        isAccountOwned: true,
                    },
                ],
                vout: [
                    {
                        n: 0,
                        isAddress: true,
                        addresses: ['tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q'],
                        value: '600',
                    },
                    {
                        n: 1,
                        isAddress: true,
                        addresses: ['tb1qejz7yqgcn4wqu8hca9gxcl3rzwunck5djedy6l'],
                        value: '3259',
                        isAccountOwned: true,
                    },
                ],
                size: 562,
                totalInput: '4000',
                totalOutput: '3859',
            },
            deadline: 2820254,
            rbfParams: {
                txid: '63462b8fa1a74109f03f10d5f9b13c02e5ed1a12afe5bea1e7d7d01a9e775777',
                utxo: [
                    {
                        amount: '4000',
                        txid: '97306300a334cc53412cd12b29dc5f4eb24384eada69ad3be6127cf947cf9c87',
                        vout: 0,
                        address: 'tb1qt9juh0yeszxq686xmxgdrmrmxcuy02ugugw572',
                        path: "m/84'/1'/0'/0/0",
                        blockHeight: 0,
                        confirmations: 0,
                        required: true,
                    },
                ],
                outputs: [
                    {
                        type: 'payment',
                        address: 'tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q',
                        amount: '600',
                        formattedAmount: '0.000006',
                    },
                    {
                        type: 'change',
                        address: 'tb1qejz7yqgcn4wqu8hca9gxcl3rzwunck5djedy6l',
                        amount: '3259',
                        formattedAmount: '0.00003259',
                    },
                ],
                changeAddress: {
                    address: 'tb1qejz7yqgcn4wqu8hca9gxcl3rzwunck5djedy6l',
                    path: "m/84'/1'/0'/1/0",
                    transfers: 0,
                },
                feeRate: '1',
                baseFee: 141,
            },
        },
        {
            descriptor:
                'vpub5Z1mwnhobbM2CXU9QH39CxRp4CfCZ1FaYXxgn4L8Fhehd4GLuqgXW47MaNNiW85Qw34qEoUn2C9dNouDEGCDjz5nGYrzamqa91zzx2ERJjx',
            deviceState: 'n1ooH7an9edJDSRcciBxu6ecELknHVTS6S@FA3F661CA7DE70F5CF2170AD:1',
            symbol: 'test',
            type: 'sent',
            txid: '63462b8fa1a74109faaf10d5f9b13c02e5ed1a12afe5bea1e7d7d01a9e775799',
            hex: '01000000000101879ccf47f97c12e63bad69daea8443b24e5fdc292bd12c4153cc34a3006330970000000000fdffffff025802000000000000160014fcb55e6920e2c6f37327a5bf4a24cf42ebbaf07cbb0c000000000000160014cc85e201189d5c0e1ef8e9506c7e2313b93c5a8d02483045022100d5f0a477948d61cee10b081b7c898d0d5df6718b53b4f1ccf0fdedf852d4f22f02204fc8d970f5eb7c6df4b2a83b2375b29af7527531e416755aff5c9a7d5c21017e012103e06e169912635e46bff9ffa167b32e6f42530254068608049191893d47f5dc2d00000000',
            blockTime: 1717673572 - 4444,
            blockHeight: 0,
            amount: '600',
            fee: '141',
            vsize: 141,
            feeRate: '1',
            targets: [
                {
                    n: 0,
                    addresses: ['tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q'],
                    isAddress: true,
                    amount: '600',
                },
            ],
            tokens: [],
            internalTransfers: [],
            rbf: true,
            details: {
                vin: [
                    {
                        n: 0,
                        txid: '97306300a334cc53412cd12b29dc5f4eb24384eada69ad3be6127cf947cf9c87',
                        vout: 0,
                        isAddress: true,
                        addresses: ['tb1qt9juh0yeszxq686xmxgdrmrmxcuy02ugugw572'],
                        value: '4000',
                        sequence: 4294967293,
                        isAccountOwned: true,
                    },
                ],
                vout: [
                    {
                        n: 0,
                        isAddress: true,
                        addresses: ['tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q'],
                        value: '600',
                    },
                    {
                        n: 1,
                        isAddress: true,
                        addresses: ['tb1qejz7yqgcn4wqu8hca9gxcl3rzwunck5djedy6l'],
                        value: '3259',
                        isAccountOwned: true,
                    },
                ],
                size: 562,
                totalInput: '4000',
                totalOutput: '3859',
            },
            deadline: 2820254,
            rbfParams: {
                txid: '63462b8fa1a74109f03f10d5f9b13c02e5ed1a12afe5bea1e7d7d01a9e775777',
                utxo: [
                    {
                        amount: '4000',
                        txid: '97306300a334cc53412cd12b29dc5f4eb24384eada69ad3be6127cf947cf9c87',
                        vout: 0,
                        address: 'tb1qt9juh0yeszxq686xmxgdrmrmxcuy02ugugw572',
                        path: "m/84'/1'/0'/0/0",
                        blockHeight: 0,
                        confirmations: 0,
                        required: true,
                    },
                ],
                outputs: [
                    {
                        type: 'payment',
                        address: 'tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q',
                        amount: '600',
                        formattedAmount: '0.000006',
                    },
                    {
                        type: 'change',
                        address: 'tb1qejz7yqgcn4wqu8hca9gxcl3rzwunck5djedy6l',
                        amount: '3259',
                        formattedAmount: '0.00003259',
                    },
                ],
                changeAddress: {
                    address: 'tb1qejz7yqgcn4wqu8hca9gxcl3rzwunck5djedy6l',
                    path: "m/84'/1'/0'/1/0",
                    transfers: 0,
                },
                feeRate: '1',
                baseFee: 141,
            },
        },
        // pending 4.6.2024
        {
            descriptor:
                'vpub5Z1mwnhobbM2CXU9QH39CxRp4CfCZ1FaYXxgn4L8Fhehd4GLuqgXW47MaNNiW85Qw34qEoUn2C9dNouDEGCDjz5nGYrzamqa91zzx2ERJjx',
            deviceState: 'n1ooH7an9edJDSRcciBxu6ecELknHVTS6S@FA3F661CA7DE70F5CF2170AD:1',
            symbol: 'test',
            type: 'sent',
            txid: '63462b8fa1a74109f03f10d5f9b13c02e5ed1a12afe5bea1e7d7d01a9e775777',
            hex: '01000000000101879ccf47f97c12e63bad69daea8443b24e5fdc292bd12c4153cc34a3006330970000000000fdffffff025802000000000000160014fcb55e6920e2c6f37327a5bf4a24cf42ebbaf07cbb0c000000000000160014cc85e201189d5c0e1ef8e9506c7e2313b93c5a8d02483045022100d5f0a477948d61cee10b081b7c898d0d5df6718b53b4f1ccf0fdedf852d4f22f02204fc8d970f5eb7c6df4b2a83b2375b29af7527531e416755aff5c9a7d5c21017e012103e06e169912635e46bff9ffa167b32e6f42530254068608049191893d47f5dc2d00000000',
            blockTime: 1717673572 - 173000,
            blockHeight: 0,
            amount: '600',
            fee: '141',
            vsize: 141,
            feeRate: '1',
            targets: [
                {
                    n: 0,
                    addresses: ['tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q'],
                    isAddress: true,
                    amount: '600',
                },
            ],
            tokens: [],
            internalTransfers: [],
            rbf: true,
            details: {
                vin: [
                    {
                        n: 0,
                        txid: '97306300a334cc53412cd12b29dc5f4eb24384eada69ad3be6127cf947cf9c87',
                        vout: 0,
                        isAddress: true,
                        addresses: ['tb1qt9juh0yeszxq686xmxgdrmrmxcuy02ugugw572'],
                        value: '4000',
                        sequence: 4294967293,
                        isAccountOwned: true,
                    },
                ],
                vout: [
                    {
                        n: 0,
                        isAddress: true,
                        addresses: ['tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q'],
                        value: '600',
                    },
                    {
                        n: 1,
                        isAddress: true,
                        addresses: ['tb1qejz7yqgcn4wqu8hca9gxcl3rzwunck5djedy6l'],
                        value: '3259',
                        isAccountOwned: true,
                    },
                ],
                size: 562,
                totalInput: '4000',
                totalOutput: '3859',
            },
            deadline: 2820254,
            rbfParams: {
                txid: '63462b8fa1a74109f03f10d5f9b13c02e5ed1a12afe5bea1e7d7d01a9e775777',
                utxo: [
                    {
                        amount: '4000',
                        txid: '97306300a334cc53412cd12b29dc5f4eb24384eada69ad3be6127cf947cf9c87',
                        vout: 0,
                        address: 'tb1qt9juh0yeszxq686xmxgdrmrmxcuy02ugugw572',
                        path: "m/84'/1'/0'/0/0",
                        blockHeight: 0,
                        confirmations: 0,
                        required: true,
                    },
                ],
                outputs: [
                    {
                        type: 'payment',
                        address: 'tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q',
                        amount: '600',
                        formattedAmount: '0.000006',
                    },
                    {
                        type: 'change',
                        address: 'tb1qejz7yqgcn4wqu8hca9gxcl3rzwunck5djedy6l',
                        amount: '3259',
                        formattedAmount: '0.00003259',
                    },
                ],
                changeAddress: {
                    address: 'tb1qejz7yqgcn4wqu8hca9gxcl3rzwunck5djedy6l',
                    path: "m/84'/1'/0'/1/0",
                    transfers: 0,
                },
                feeRate: '1',
                baseFee: 141,
            },
        },
        // confirmed 6.6.2024
        {
            descriptor:
                'vpub5Z1mwnhobbM2CXU9QH39CxRp4CfCZ1FaYXxgn4L8Fhehd4GLuqgXW47MaNNiW85Qw34qEoUn2C9dNouDEGCDjz5nGYrzamqa91zzx2ERJjx',
            deviceState: 'n1ooH7an9edJDSRcciBxu6ecELknHVTS6S@FA3F661CA7DE70F5CF2170AD:1',
            symbol: 'test',
            type: 'recv',
            txid: '97306300a334cc53412cd12b29dc5f4eb24384eada69ad3be6127cf947cf9c87',
            blockTime: 1717680170,
            blockHeight: 2820252,
            blockHash: '000000008e648f47672ea1b2f444971652d663e2816a93e07ed439a765aa76c0',
            lockTime: 2820159,
            amount: '4000',
            fee: '200988',
            vsize: 196,
            feeRate: '1025.45',
            targets: [
                {
                    n: 0,
                    addresses: ['tb1qt9juh0yeszxq686xmxgdrmrmxcuy02ugugw572'],
                    isAddress: true,
                    amount: '4000',
                    isAccountTarget: true,
                },
            ],
            tokens: [],
            internalTransfers: [],
            rbf: true,
            details: {
                vin: [
                    {
                        txid: '9def45c8cc8bcfd58735ee0221f091b1a68493497695eab4752bf76d84dacb2c',
                        sequence: 4294967293,
                        n: 0,
                        addresses: ['tb1qsh0xrq7ew469q39lc45r965t6hf8dvc3vlhg8c'],
                        isAddress: true,
                        value: '739157853',
                    },
                ],
                vout: [
                    {
                        value: '4000',
                        n: 0,
                        hex: '00145965cbbc99808c0d1f46d990d1ec7b363847ab88',
                        addresses: ['tb1qt9juh0yeszxq686xmxgdrmrmxcuy02ugugw572'],
                        isAddress: true,
                        isOwn: true,
                        isAccountOwned: true,
                    },
                    {
                        value: '3990',
                        n: 1,
                        hex: '512059a19c83b55328b59828073982ddd080a41b9078ce40057f900090ed7a8541c0',
                        addresses: [
                            'tb1ptxseeqa42v5ttxpgquuc9hwsszjphyrceeqq2lusqzgw6759g8qqezz8x9',
                        ],
                        isAddress: true,
                    },
                    {
                        value: '738948875',
                        n: 2,
                        hex: '5120b2988546a8e785f31f9577d6501d6c2a701d43297dc1a8836a0760bf9d2d036f',
                        addresses: [
                            'tb1pk2vg234gu7zlx8u4wlt9q8tv9fcp6sef0hq63qm2qastl8fdqdhsmuqtav',
                        ],
                        isAddress: true,
                    },
                ],
                size: 277,
                totalInput: '739157853',
                totalOutput: '738956865',
            },
        },
        {
            descriptor:
                'vpub5Z1mwnhobbM2CXU9QH39CxRp4CfCZ1FaYXxgn4L8Fhehd4GLuqgXW47MaNNiW85Qw34qEoUn2C9dNouDEGCDjz5nGYrzamqa91zzx2ERJjx',
            deviceState: 'n1ooH7an9edJDSRcciBxu6ecELknHVTS6S@FA3F661CA7DE70F5CF2170AD:1',
            symbol: 'test',
            type: 'recv',
            txid: '97306300a334cc53412cd12b29dc5f4eb24384eada69ad3be6127cf947cf9c87',
            blockTime: 1717680170 - 5555,
            blockHeight: 2820252 - 20,
            blockHash: '000000008e648f47672ea1b2f444971652d663e2816a93e07ed439a765aa76c0',
            lockTime: 2820159,
            amount: '4000',
            fee: '200988',
            vsize: 196,
            feeRate: '1025.45',
            targets: [
                {
                    n: 0,
                    addresses: ['tb1qt9juh0yeszxq686xmxgdrmrmxcuy02ugugw572'],
                    isAddress: true,
                    amount: '4000',
                    isAccountTarget: true,
                },
            ],
            tokens: [],
            internalTransfers: [],
            rbf: true,
            details: {
                vin: [
                    {
                        txid: '9def45c8cc8bcfd58735ee0221f091b1a68493497695eab4752bf76d84dacb2c',
                        sequence: 4294967293,
                        n: 0,
                        addresses: ['tb1qsh0xrq7ew469q39lc45r965t6hf8dvc3vlhg8c'],
                        isAddress: true,
                        value: '739157853',
                    },
                ],
                vout: [
                    {
                        value: '4000',
                        n: 0,
                        hex: '00145965cbbc99808c0d1f46d990d1ec7b363847ab88',
                        addresses: ['tb1qt9juh0yeszxq686xmxgdrmrmxcuy02ugugw572'],
                        isAddress: true,
                        isOwn: true,
                        isAccountOwned: true,
                    },
                    {
                        value: '3990',
                        n: 1,
                        hex: '512059a19c83b55328b59828073982ddd080a41b9078ce40057f900090ed7a8541c0',
                        addresses: [
                            'tb1ptxseeqa42v5ttxpgquuc9hwsszjphyrceeqq2lusqzgw6759g8qqezz8x9',
                        ],
                        isAddress: true,
                    },
                    {
                        value: '738948875',
                        n: 2,
                        hex: '5120b2988546a8e785f31f9577d6501d6c2a701d43297dc1a8836a0760bf9d2d036f',
                        addresses: [
                            'tb1pk2vg234gu7zlx8u4wlt9q8tv9fcp6sef0hq63qm2qastl8fdqdhsmuqtav',
                        ],
                        isAddress: true,
                    },
                ],
                size: 277,
                totalInput: '739157853',
                totalOutput: '738956865',
            },
        },
    ] as WalletAccountTransaction[];

    if (accountTransactionsMock.length > 0 || transactionsIsLoading) {
        const networksWithoutTxSummary = ['ripple', 'solana'];

        console.log(accountTransactions);

        return (
            <Layout selectedAccount={selectedAccount}>
                {!networksWithoutTxSummary.includes(account.networkType) && (
                    <TransactionSummary account={account} />
                )}
                <TradeBox account={account} />
                <TransactionList
                    account={account}
                    transactions={accountTransactionsMock}
                    symbol={account.symbol}
                    isLoading={transactionsIsLoading}
                />
            </Layout>
        );
    }

    if (account.empty) {
        return (
            <Layout selectedAccount={selectedAccount} showEmptyHeaderPlaceholder>
                <AccountEmpty account={selectedAccount.account} />
            </Layout>
        );
    }

    return (
        <Layout selectedAccount={selectedAccount} showEmptyHeaderPlaceholder>
            <NoTransactions account={account} />
        </Layout>
    );
};
