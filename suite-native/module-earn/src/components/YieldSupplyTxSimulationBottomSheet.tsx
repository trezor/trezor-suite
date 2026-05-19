import { useMemo } from 'react';

import { composeStablecoinYieldTxSimulationAction } from '@suite-common/earn-stablecoin';
import { type Account } from '@suite-common/wallet-types';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Button,
    FullAlertBox,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { EvmTxSimulationReviewContent } from '@suite-native/tx-simulation';

import { STABLECOIN_YIELD_NATIVE_SOURCE_ORIGIN } from '../constants';
import { YieldSupplyTxSimulationHeader } from './YieldSupplyTxSimulationHeader';
import { type PreparedYieldSupplyAction } from '../hooks/useYieldSupplyFees';

type YieldSupplyTxSimulationBottomSheetProps = {
    account: Account;
    onCancel: () => void;
    onConfirm: () => void;
    preparedAction: PreparedYieldSupplyAction;
    ref: BottomSheetModalRef;
};

export const YieldSupplyTxSimulationBottomSheet = ({
    account,
    onCancel,
    onConfirm,
    preparedAction,
    ref,
}: YieldSupplyTxSimulationBottomSheetProps) => {
    const parsedData = useMemo(
        () =>
            composeStablecoinYieldTxSimulationAction(
                {
                    flow: 'deposit',
                    account,
                    unsignedTx: preparedAction.unsignedTransaction,
                },
                STABLECOIN_YIELD_NATIVE_SOURCE_ORIGIN,
            ),
        [account, preparedAction.unsignedTransaction],
    );

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="moduleConnectPopup.simulation.reviewTransaction" />}
            isCloseDisplayed
            onClose={onCancel}
        >
            {parsedData ? (
                <EvmTxSimulationReviewContent
                    action={parsedData.action}
                    cancelButton={
                        <Button intent="neutral" priority="secondary" onPress={onCancel}>
                            <Translation id="generic.buttons.cancel" />
                        </Button>
                    }
                    headerContent={
                        <YieldSupplyTxSimulationHeader
                            accountLabel={account.accountLabel}
                            networkSymbol={account.symbol}
                        />
                    }
                    onConfirm={onConfirm}
                />
            ) : (
                <FullAlertBox
                    variant="critical"
                    title={<Translation id="moduleConnectPopup.simulation.simulationStatusError" />}
                />
            )}
        </BottomSheetModal>
    );
};
