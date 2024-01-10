import { useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import { spacingsPx, zIndices } from '@trezor/theme';
import { selectDevice } from '@suite-common/wallet-core';

import { useDiscovery, useSelector } from 'src/hooks/suite';
import { AccountSearchBox } from './AccountSearchBox';
import { AccountItemSkeleton } from './AccountItemSkeleton';
import { AddAccountButton } from './AddAccountButton';
import { CoinsFilter } from './CoinsFilter';
import { AccountsList } from './AccountsList';
import { getFailedAccounts, sortByCoin } from '@suite-common/wallet-utils';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    z-index: ${zIndices.expandableNavigationHeader};
    width: 100%;
    overflow: auto;
`;

const MenuHeader = styled.div`
    display: flex;
    flex-direction: column;
    border-top: 1px solid ${({ theme }) => theme.borderOnElevation0};
    padding: ${spacingsPx.xs} ${spacingsPx.xs} 0 ${spacingsPx.xs};
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${spacingsPx.xs};
`;

const gradientBase = css<{ isVisible: boolean }>`
    width: 100%;
    height: 45px;
    z-index: 1;
    position: absolute;
    pointer-events: none;
    opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
    transition: all 0.2s ease-in;
`;

const GradientBefore = styled.div`
    ${gradientBase}
    top: 0;
    background: linear-gradient(
        ${({ theme }) => theme.backgroundSurfaceElevationNegative},
        rgba(0 0 0 / 0%)
    );
`;
const GradientAfter = styled.div`
    ${gradientBase}
    bottom: 0;
    background: linear-gradient(
        rgba(0 0 0 / 0%),
        ${({ theme }) => theme.backgroundSurfaceElevationNegative}
    );
`;

const Gradients = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    overflow: auto;
    position: relative;
`;

const Scroll = styled.div`
    height: auto;
    overflow: hidden auto;
`;

export const AccountsMenu = () => {
    const device = useSelector(selectDevice);
    const accounts = useSelector(state => state.wallet.accounts);

    const [isScrolledToTop, setIsScrolledToTop] = useState(true);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    const { discovery } = useDiscovery();

    const handleScroll = () => {
        if (containerRef?.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

            setIsScrolledToTop(scrollTop === 0);
            setIsScrolledToBottom(Math.ceil(scrollTop + clientHeight) >= scrollHeight);
        }
    };

    if (!device || !discovery) {
        return (
            <Wrapper>
                <Scroll>
                    <MenuHeader>
                        <AccountSearchBox />
                    </MenuHeader>
                    <AccountItemSkeleton elevation={0} />
                </Scroll>
            </Wrapper>
        );
    }

    const failed = getFailedAccounts(discovery);

    const list = sortByCoin(accounts.filter(a => a.deviceState === device.state).concat(failed));

    const isEmpty = list.length === 0;
    return (
        <Wrapper>
            <MenuHeader>
                <Row>
                    <AccountSearchBox />
                    <AddAccountButton data-test="@account-menu/add-account" device={device} />
                </Row>

                <CoinsFilter />
            </MenuHeader>

            <Gradients>
                <GradientBefore isVisible={!isScrolledToTop} />
                <Scroll ref={containerRef} onScroll={handleScroll}>
                    <AccountsList />
                </Scroll>
                <GradientAfter isVisible={!isScrolledToBottom} />
            </Gradients>
        </Wrapper>
    );
};
