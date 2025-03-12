import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';

import { useSelector, useTranslation } from 'src/hooks/suite';
import { selectIsLabelingAvailable } from 'src/reducers/suite/metadataReducer';

export const useExampleCSV = (): string => {
    const { account } = useSelector(state => state.wallet.selectedAccount);
    const isLabelingAvailable = useSelector(selectIsLabelingAvailable);
    const { translationString } = useTranslation();

    if (!account) return '';

    // for BTC get first two unused addresses
    // for ETH and XRP descriptor get twice (used in two examples)
    const addresses = account.addresses?.unused.slice(0, 2).map(a => a.address) || [
        account.descriptor,
        account.descriptor,
    ];

    // Create header line
    const headerLine = `address,amount,currency${isLabelingAvailable ? ',label' : ''}`;

    // Create example lines
    const example1 = `${addresses[0]},0.31337,${getNetworkDisplaySymbol(account.symbol)}${
        isLabelingAvailable ? `,${translationString('TR_SENDFORM_LABELING_EXAMPLE_1')}` : ''
    }`;

    const example2 = `${addresses[1]},0.1,USD${
        isLabelingAvailable ? `,${translationString('TR_SENDFORM_LABELING_EXAMPLE_2')}` : ''
    }`;

    // Combine all lines with newlines
    return `${headerLine}\n${example1}\n${example2}`;
};
