import { MetadataState } from '@suite-common/metadata-types';
import {
    originalTransactionSpendAccount,
    chainSpendingReceivedCoins,
} from './moveLabelsForRbfTransactions.fixture';

export const moveLabelsForRbfMetadataStateFixture: MetadataState = {
    enabled: true,
    initiating: false,
    providers: [
        {
            type: 'inMemoryTest',
            isCloud: false,
            tokens: {},
            user: '',
            clientId: '',
            data: {
                '7061500d8482d422b07cbd59784db51ae60f72a5c25f47d3d344888585e0c37d.mtdt': {
                    accountLabel: '',
                    outputLabels: {
                        [originalTransactionSpendAccount.txid]: {
                            '1': '1A',
                            '2': '1B',
                        },
                    },
                    addressLabels: {},
                },
                '803c346fae1cac3580afdf34c480d0691b57bce10f4fccf671ecbf902c9c7b20.mtdt': {
                    accountLabel: '',
                    outputLabels: {
                        [originalTransactionSpendAccount.txid]: {
                            '1': '2A',
                            '2': '2B',
                        },
                        [chainSpendingReceivedCoins.txid]: {
                            '1': '2C',
                        },
                    },
                    addressLabels: {},
                },
            },
        },
    ],
    selectedProvider: {
        labels: '',
        passwords: '',
    },
    error: {},
};
