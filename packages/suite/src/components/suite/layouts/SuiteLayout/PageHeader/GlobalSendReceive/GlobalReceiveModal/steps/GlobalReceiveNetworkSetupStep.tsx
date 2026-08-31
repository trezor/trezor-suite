import { Translation } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { Column, H4, Paragraph, Spinner } from '@trezor/components';

import { AssetsModal } from 'src/components/suite/asset-picker/components';

import { GlobalReceiveAssetDescription } from '../components/GlobalReceiveAssetDescription';
import { GLOBAL_RECEIVE_MODAL_HEIGHT } from '../constants';
import { useGlobalReceiveNetworkSetup } from '../hooks/useGlobalReceiveNetworkSetup';

type GlobalReceiveNetworkSetupStepProps = {
    asset: TradingAssetOption | undefined;
    assetAccounts: Account[];
    wasAssetNetworkInactive: boolean;
    onAccountSelectionRequired: () => void;
    onBack: () => void;
    onCancel: () => void;
    onSubmit: (account: Account) => void;
};

export const GlobalReceiveNetworkSetupStep = ({
    asset,
    assetAccounts,
    wasAssetNetworkInactive,
    onAccountSelectionRequired,
    onBack,
    onCancel,
    onSubmit,
}: GlobalReceiveNetworkSetupStepProps) => {
    useGlobalReceiveNetworkSetup({
        selectedAsset: asset,
        selectedAssetAccounts: assetAccounts,
        wasSelectedAssetNetworkInactive: wasAssetNetworkInactive,
        onAccountSelectionRequired,
        onSetupFailure: onBack,
        submitSelection: onSubmit,
    });

    return (
        <AssetsModal
            heading={<Translation id="TR_RECEIVE" />}
            description={<GlobalReceiveAssetDescription asset={asset} />}
            onBackClick={onBack}
            onClose={onCancel}
            maxHeight={GLOBAL_RECEIVE_MODAL_HEIGHT}
            padding={16}
            data-testid="@global-receive/modal"
        >
            <Column alignItems="center" gap={16} padding={{ vertical: 24 }}>
                <Spinner size={48} />
                <Column alignItems="center">
                    <H4 typographyStyle="body-sm">
                        <Translation id="TR_GLOBAL_RECEIVE_GETTING_ACCOUNT_READY" />
                    </H4>
                    <Paragraph
                        typographyStyle="body-sm"
                        align="center"
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation
                            id="TR_GLOBAL_RECEIVE_SETUP_DESCRIPTION"
                            values={{ network: asset?.networkName ?? '' }}
                        />
                    </Paragraph>
                </Column>
            </Column>
        </AssetsModal>
    );
};
