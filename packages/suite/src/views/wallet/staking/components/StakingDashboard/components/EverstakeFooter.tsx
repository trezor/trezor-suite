import { useMemo } from 'react';

import { Column, Divider, Icon, Paragraph, Row } from '@trezor/components';
import {
    HELP_CENTER_ADA_STAKING,
    HELP_CENTER_ETH_STAKING,
    HELP_CENTER_SOL_STAKING,
} from '@trezor/urls';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

export const EverstakeFooter = () => {
    const account = useSelector(selectSelectedAccount);

    const learnMoreLink = useMemo(() => {
        switch (account?.networkType) {
            case 'ethereum':
                return HELP_CENTER_ETH_STAKING;
            case 'solana':
                return HELP_CENTER_SOL_STAKING;
            case 'cardano':
                return HELP_CENTER_ADA_STAKING;
            default:
                return undefined;
        }
    }, [account]);

    return (
        <Column>
            <Divider />
            <Row justifyContent="space-between">
                <Row gap={8}>
                    <Paragraph variant="tertiary">
                        <Translation id="TR_STAKE_PROVIDED_BY" />
                    </Paragraph>
                    <Icon size={20} name="everstakeLogo" variant="default" />
                </Row>
                {learnMoreLink && <LearnMoreButton url={learnMoreLink} />}
            </Row>
        </Column>
    );
};
