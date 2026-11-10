import { Translation } from '@suite/intl';
import { type Account, type FeeInfo, type PrecomposedLevels } from '@suite-common/wallet-types';
import { Banner, Card, Column } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { Fees, type FeesProps } from '../Fees/Fees';
import { type AllowanceComposeError } from './hooks/useAllowanceTransaction';

type AllowanceFeesProps = {
    account: Account;
    feeInfo: FeeInfo;
    composedLevels: PrecomposedLevels | undefined;
    onFeeLevelChange: FeesProps['changeFeeLevel'];
    error?: AllowanceComposeError;
};

export const AllowanceFees = ({
    account,
    feeInfo,
    composedLevels,
    onFeeLevelChange,
    error,
}: AllowanceFeesProps) => (
    <Column gap={12}>
        <Card>
            <Fees
                label="TR_NETWORK_FEE"
                feeInfo={feeInfo}
                account={account}
                composedLevels={composedLevels}
                changeFeeLevel={onFeeLevelChange}
                headerTypographyStyle="body-sm"
            />
        </Card>

        {error && (
            <Banner
                intent="critical"
                icon={WarningIcon}
                description={<Translation id={error.id} values={error.values} />}
            />
        )}
    </Column>
);
