import { useMemo } from 'react';

import {
    type StablecoinYieldTxSimulationParams,
    composeStablecoinYieldTxSimulationAction,
} from '@suite-common/earn-stablecoin';
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
import { YieldDepositTxSimulationHeader } from './YieldDepositTxSimulationHeader';

type ClaimTxSimulationParams = Extract<StablecoinYieldTxSimulationParams, { flow: 'claim' }>;

type YieldTxSimulationBottomSheetProps = {
    account: Account;
    onCancel: () => void;
    onConfirm: () => void;
    ref: BottomSheetModalRef;
} & (
    | {
          flow: 'deposit' | 'withdraw' | 'wrap' | 'unwrap';
          unsignedTx: string;
      }
    | {
          flow: 'claim';
          unsignedTx: ClaimTxSimulationParams['unsignedTx'];
      }
);

export const YieldTxSimulationBottomSheet = ({
    account,
    flow,
    onCancel,
    onConfirm,
    ref,
    unsignedTx,
}: YieldTxSimulationBottomSheetProps) => {
    const parsedData = useMemo(
        () =>
            composeStablecoinYieldTxSimulationAction(
                {
                    flow,
                    account,
                    unsignedTx,
                },
                STABLECOIN_YIELD_NATIVE_SOURCE_ORIGIN,
            ),
        [account, flow, unsignedTx],
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
                        <YieldDepositTxSimulationHeader
                            accountLabel={account.accountLabel}
                            networkSymbol={account.symbol}
                        />
                    }
                    onConfirm={onConfirm}
                />
            ) : (
                <FullAlertBox
                    intent="critical"
                    title={<Translation id="moduleConnectPopup.simulation.simulationStatusError" />}
                />
            )}
        </BottomSheetModal>
    );
};
