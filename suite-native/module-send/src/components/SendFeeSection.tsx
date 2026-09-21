import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    type FeesRootState,
    type SendRootState,
    selectAccountNetworkSymbol,
    selectNetworkFeeStatus,
    selectRawNetworkFeeInfo,
    selectSendFormDraftByKey,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { BannerInline, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { updateSelectedFeeLevelThunk } from '@suite-native/send';
import { FeeSelector } from '@suite-native/transaction-management';

type SendFeeSectionProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    isFormValid: boolean;
};

export const SendFeeSection = ({ accountKey, tokenContract, isFormValid }: SendFeeSectionProps) => {
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const formDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByKey(state, accountKey, tokenContract),
    );
    const rawNetworkFeeInfo = useSelector((state: FeesRootState) =>
        selectRawNetworkFeeInfo(state, networkSymbol ?? undefined),
    );
    const networkFeeStatus = useSelector((state: FeesRootState) =>
        selectNetworkFeeStatus(state, networkSymbol ?? undefined),
    );

    const { dispatch } = useServices(injectDispatch);

    if (!isFormValid || !networkSymbol) {
        return null;
    }

    const areNetworkFeesUnavailable =
        networkFeeStatus === 'error' && !rawNetworkFeeInfo?.levels.length;

    const retryNetworkFeeFetch = () => {
        dispatch(updateFeeInfoThunk({ networkSymbol }));
    };

    return (
        <Box marginTop="sp16">
            {areNetworkFeesUnavailable ? (
                <BannerInline
                    intent="critical"
                    title={<Translation id="moduleSend.fees.unavailable" />}
                    buttonLabel={<Translation id="generic.buttons.retry" />}
                    onButtonPress={retryNetworkFeeFetch}
                />
            ) : (
                <FeeSelector
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    updateThunk={updateSelectedFeeLevelThunk}
                    selectedFee={formDraft?.selectedFee ?? 'normal'}
                    selectedFeePerUnit={formDraft?.feePerUnit}
                    selectedSetMaxOutputId={formDraft?.setMaxOutputId}
                    formDraft={formDraft}
                />
            )}
        </Box>
    );
};
