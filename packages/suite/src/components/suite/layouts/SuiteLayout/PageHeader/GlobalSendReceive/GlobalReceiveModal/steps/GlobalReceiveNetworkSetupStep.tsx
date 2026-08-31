import { Translation } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';
import { Column, H4, Paragraph, Spinner } from '@trezor/components';

import { AssetsModal } from 'src/components/suite/asset-picker/components';

import { GlobalReceiveAssetDescription } from '../components/GlobalReceiveAssetDescription';

type GlobalReceiveNetworkSetupStepProps = {
    asset: TradingAssetOption | undefined;
    onBack: () => void;
    onCancel: () => void;
};

export const GlobalReceiveNetworkSetupStep = ({
    asset,
    onBack,
    onCancel,
}: GlobalReceiveNetworkSetupStepProps) => (
    <AssetsModal
        heading={<Translation id="TR_RECEIVE" />}
        description={<GlobalReceiveAssetDescription asset={asset} />}
        onBackClick={onBack}
        onClose={onCancel}
        maxHeight={670}
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
