import { Account } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { AccountLabel } from 'src/components/suite/AccountLabel';
import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { useSelector } from 'src/hooks/suite';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';

interface TxSimulationHeaderProps {
    account: Account | null;
}

export function TxSimulationHeader({ account }: TxSimulationHeaderProps) {
    const accountLabels = useSelector(selectAccountLabels);

    return (
        <Row
            columnGap={spacings.md}
            rowGap={spacings.xxs}
            flexWrap="wrap"
            margin={{ top: spacings.xs }}
        >
            {account && (
                <Row gap={spacings.xxs}>
                    <CoinLogo size={14} symbol={account.symbol} />
                    <AccountLabel
                        account={{
                            ...account,
                            accountLabel: accountLabels[account.key] || account.accountLabel,
                        }}
                        showAccountTypeBadge
                        accountTypeBadgeSize="small"
                    />
                </Row>
            )}
            <ConnectCallSource />
        </Row>
    );
}
