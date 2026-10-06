import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type BottomSheetModalRef } from '@suite-native/atoms';

import { YieldTxSimulationBottomSheet } from './YieldTxSimulationBottomSheet';

type YieldSessionTxSimulationSheetProps = {
    sheet: {
        bottomSheetRef: BottomSheetModalRef;
        unsignedTransaction: string;
        onConfirm: () => void;
        onCancel: () => void;
    } | null;
    account: Account;
    flow: 'deposit' | WrappedNativeFlowType;
};

export const YieldSessionTxSimulationSheet = ({
    sheet,
    account,
    flow,
}: YieldSessionTxSimulationSheetProps) => {
    if (!sheet) {
        return null;
    }

    return (
        <YieldTxSimulationBottomSheet
            ref={sheet.bottomSheetRef}
            account={account}
            flow={flow}
            onCancel={sheet.onCancel}
            onConfirm={sheet.onConfirm}
            unsignedTx={sheet.unsignedTransaction}
        />
    );
};
