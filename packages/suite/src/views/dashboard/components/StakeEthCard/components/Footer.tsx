import { Button, Paragraph, Row } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { NetworkBadge } from './NetworkBadge';
import { useAccountSearch, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { spacings } from '@trezor/theme';

interface FooterProps {
    accountIndex: number | undefined;
    hideSection: () => void;
}

export const Footer = ({ accountIndex = 0, hideSection }: FooterProps) => {
    const dispatch = useDispatch();
    const { setCoinFilter, setSearchString } = useAccountSearch();
    const goToEthStakingTab = () => {
        dispatch(
            goto('wallet-staking', {
                params: {
                    symbol: 'eth',
                    accountIndex,
                    accountType: 'normal',
                },
            }),
        );
        // activate coin filter and reset account search string
        setCoinFilter('eth');
        setSearchString(undefined);
    };

    return (
        <Row justifyContent="space-between" alignItems="center" gap={spacings.xs}>
            <div>
                <Paragraph variant="tertiary" typographyStyle="label">
                    <Translation id="TR_AVAILABLE_NOW_FOR" />
                </Paragraph>
                <NetworkBadge logo="eth" name={<Translation id="TR_NETWORK_ETHEREUM" />} />
            </div>

            <Row gap={spacings.xs}>
                <Button onClick={goToEthStakingTab}>
                    <Translation id="TR_STAKE_START_STAKING" />
                </Button>
                <Button variant="tertiary" onClick={hideSection}>
                    <Translation id="TR_MAYBE_LATER" />
                </Button>
            </Row>
        </Row>
    );
};
