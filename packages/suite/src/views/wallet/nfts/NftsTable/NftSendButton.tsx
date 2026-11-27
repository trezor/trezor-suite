import { Translation } from '@suite/intl';
import { toTokenAddress } from '@suite-common/tokens';
import { type Account } from '@suite-common/wallet-types';
import { IconButton } from '@trezor/components';
import { ArrowUpIcon } from '@trezor/icons';

import { useStartSendReceiveWithAnalytics } from '#src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/hooks/useStartSendReceiveWithAnalytics';

type NftSendButtonProps = {
    account: Account;
    contract: string;
    tokenId: string;
};

export const NftSendButton = ({ account, contract, tokenId }: NftSendButtonProps) => {
    const { startNFTSend } = useStartSendReceiveWithAnalytics();

    return (
        <IconButton
            icon={ArrowUpIcon}
            size="small"
            intent="neutral"
            priority="secondary"
            onClick={() =>
                startNFTSend({ account, contractAddress: toTokenAddress(contract), tokenId })
            }
            tooltip={{ content: <Translation id="TR_NAV_SEND" /> }}
            data-testid={`@wallet/nfts/send-button/${contract}/${tokenId}`}
        />
    );
};
