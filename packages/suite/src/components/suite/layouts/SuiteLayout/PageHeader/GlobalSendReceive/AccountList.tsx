import styled from 'styled-components';

import { Account } from '@suite-common/wallet-types';
import { useElevation, useScrollShadow } from '@trezor/components';
import { mapElevationToBackgroundToken } from '@trezor/theme';

import { AccountItemType } from '../../../../../../types/wallet';
import { AccountsList } from '../../../../../wallet/WalletLayout/AccountsMenu/AccountsList';

const ScrollContainer = styled.div`
    height: auto;
    overflow: hidden auto;
`;

type AccountListProps = { onSubmit: (account: Account, type: AccountItemType) => void };

export const AccountList = ({ onSubmit }: AccountListProps) => {
    const { scrollElementRef, onScroll, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow();

    const { elevation } = useElevation();
    const shadowColor = mapElevationToBackgroundToken({
        $elevation: elevation,
    });

    return (
        <ShadowContainer>
            <ShadowTop backgroundColor={shadowColor} />
            <ScrollContainer ref={scrollElementRef} onScroll={onScroll}>
                <AccountsList forceOnlyItemClick onItemClick={onSubmit} />
            </ScrollContainer>
            <ShadowBottom backgroundColor={shadowColor} />
        </ShadowContainer>
    );
};
