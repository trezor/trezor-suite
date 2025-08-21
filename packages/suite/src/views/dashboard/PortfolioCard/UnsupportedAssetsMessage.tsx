import styled from 'styled-components';

import { TrezorDevice } from '@suite-common/suite-types';
import { Account } from '@suite-common/wallet-types';
import { Text } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { Translation } from '../../../components/suite';

const Asset = styled.span`
    display: inline-block;

    &::first-letter {
        text-transform: capitalize;
    }
`;

const UNSUPPORTED_NETWORKS = ['ripple', 'solana', 'stellar'];

export const useUnsupportedAssetsMessage = ({
    showGraphControls,
    device,
    accounts,
}: {
    showGraphControls: boolean;
    device?: TrezorDevice;
    accounts: Account[];
}) => {
    const affectedAccounts =
        showGraphControls &&
        !hasBitcoinOnlyFirmware(device) &&
        accounts
            .filter(
                account =>
                    account.history &&
                    (account.tokens?.length || UNSUPPORTED_NETWORKS.includes(account.networkType)),
            )
            .map(({ networkType }) => networkType);

    const affectedAssets = [...new Set(affectedAccounts || [])];
    const showMissingDataTooltip = affectedAssets.length > 0;

    return { affectedAssets, showMissingDataTooltip };
};

type UnsupportedAssetsMessageProps = {
    affectedAssets: string[];
};

export const UnsupportedAssetsMessage = ({ affectedAssets }: UnsupportedAssetsMessageProps) => {
    if (affectedAssets.length === 0) return null;

    return (
        <Text variant="tertiary" typographyStyle="hint">
            {affectedAssets.map((asset, index) => (
                <>
                    <Asset key={asset}>{asset}</Asset>
                    {affectedAssets.length - 1 > index ? ', ' : ''}
                </>
            ))}{' '}
            <Translation id="TR_GRAPH_MISSING_DATA_INFO" />
        </Text>
    );
};
