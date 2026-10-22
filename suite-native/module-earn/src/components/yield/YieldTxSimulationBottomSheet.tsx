import { useMemo, useRef } from 'react';

import {
    type StablecoinYieldTxSimulationParams,
    composeStablecoinYieldTxSimulationAction,
} from '@suite-common/earn-stablecoin';
import { type Account } from '@suite-common/wallet-types';
import {
    BannerFull,
    BottomSheetModal,
    type BottomSheetModalRef,
    Button,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { EvmTxSimulationReviewContent } from '@suite-native/tx-simulation';

import { YieldDepositTxSimulationHeader } from './YieldDepositTxSimulationHeader';
import { STABLECOIN_YIELD_NATIVE_SOURCE_ORIGIN } from '../../constants';

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
    const hasHandledDecisionRef = useRef(false);
    const handleCancel = () => {
        if (hasHandledDecisionRef.current) return;
        hasHandledDecisionRef.current = true;
        onCancel();
    };
    const handleConfirm = () => {
        if (hasHandledDecisionRef.current) return;
        hasHandledDecisionRef.current = true;
        onConfirm();
    };
    const handleDismiss = () => {
        if (!hasHandledDecisionRef.current) {
            onCancel();
        }
        hasHandledDecisionRef.current = false;
    };

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
            onClose={handleCancel}
            onDismiss={handleDismiss}
        >
            {parsedData ? (
                <EvmTxSimulationReviewContent
                    action={parsedData.action}
                    cancelButton={
                        <Button intent="neutral" priority="secondary" onPress={handleCancel}>
                            <Translation id="generic.buttons.cancel" />
                        </Button>
                    }
                    headerContent={
                        <YieldDepositTxSimulationHeader
                            accountLabel={account.accountLabel}
                            networkSymbol={account.symbol}
                        />
                    }
                    onConfirm={handleConfirm}
                />
            ) : (
                <BannerFull
                    intent="critical"
                    title={<Translation id="moduleConnectPopup.simulation.simulationStatusError" />}
                />
            )}
        </BottomSheetModal>
    );
};
