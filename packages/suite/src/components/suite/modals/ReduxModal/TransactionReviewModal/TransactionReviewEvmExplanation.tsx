import { Banner } from '@trezor/components';
import { networks } from '@suite-common/wallet-config';
import { spacings } from '@trezor/theme';
import { StakeType } from '@suite-common/wallet-types';

import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';

type TransactionReviewEvmExplanationProps = {
    account: Account;
    ethereumStakeType: StakeType | null;
};

export const TransactionReviewEvmExplanation = ({
    account,
    ethereumStakeType,
}: TransactionReviewEvmExplanationProps) => {
    const network = networks[account.symbol];

    if (network.networkType !== 'ethereum' || ethereumStakeType) {
        return null;
    }

    return (
        <Banner margin={{ top: spacings.sm }}>
            <Translation
                id="TR_EVM_EXPLANATION_SEND_MODAL_DESCRIPTION"
                values={{
                    network: network.name,
                    b: text => <b>{text}</b>,
                }}
            />
        </Banner>
    );
};
