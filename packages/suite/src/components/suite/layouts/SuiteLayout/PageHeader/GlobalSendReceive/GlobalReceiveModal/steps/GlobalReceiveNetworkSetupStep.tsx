import { Translation } from '@suite/intl';
import { type AssetId, parseAssetId } from '@suite-common/asset-types';
import { useFormatters } from '@suite-common/formatters';
import { type Account } from '@suite-common/wallet-types';
import { Column, H4, Paragraph, Spinner } from '@trezor/components';

import { AssetsModal } from '#src/components/suite/asset-picker/components/AssetsModal/AssetsModal';

import { GlobalSendReceiveAssetDescription } from '../../components/GlobalSendReceiveAssetDescription';
import { GLOBAL_RECEIVE_MODAL_HEIGHT } from '../constants';
import { useGlobalReceiveNetworkSetup } from '../hooks/useGlobalReceiveNetworkSetup';

type GlobalReceiveNetworkSetupStepProps = {
    selectedAssetId: AssetId | undefined;
    assetAccounts: Account[];
    wasAssetNetworkInactive: boolean;
    onAccountSelectionRequired: () => void;
    onBack?: () => void;
    onCancel: () => void;
    onSetupFailure: () => void;
    onSubmit: (account: Account) => void;
};

export const GlobalReceiveNetworkSetupStep = ({
    selectedAssetId,
    assetAccounts,
    wasAssetNetworkInactive,
    onAccountSelectionRequired,
    onBack,
    onCancel,
    onSetupFailure,
    onSubmit,
}: GlobalReceiveNetworkSetupStepProps) => {
    const { NetworkNameFormatter } = useFormatters();
    useGlobalReceiveNetworkSetup({
        selectedAssetId,
        selectedAssetAccounts: assetAccounts,
        wasSelectedAssetNetworkInactive: wasAssetNetworkInactive,
        onAccountSelectionRequired,
        onSetupFailure,
        submitSelection: onSubmit,
    });

    return (
        <AssetsModal
            heading={<Translation id="TR_RECEIVE" />}
            description={<GlobalSendReceiveAssetDescription assetId={selectedAssetId} />}
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
                            values={{
                                network: selectedAssetId ? (
                                    <NetworkNameFormatter
                                        value={parseAssetId(selectedAssetId).networkSymbol}
                                    />
                                ) : (
                                    ''
                                ),
                            }}
                        />
                    </Paragraph>
                </Column>
            </Column>
        </AssetsModal>
    );
};
