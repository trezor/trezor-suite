import { useState } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { H2, variables, Icon } from '@trezor/components';
import { zIndices, spacingsPx } from '@trezor/theme';
import { selectDevice } from '@suite-common/wallet-core';
import { Translation } from 'src/components/suite';
import { useDiscovery, useSelector } from 'src/hooks/suite';
import { AccountSearchBox } from './AccountSearchBox';
import { AddAccountButton } from './AddAccountButton';
import { CoinsFilter } from './CoinsFilter';
import { AccountsList } from './AccountsList';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    z-index: ${zIndices.expandableNavigationHeader};
    width: 100%;
`;

const MenuHeader = styled.div`
    display: flex;
    flex-direction: column;
    border-top: 1px solid ${({ theme }) => theme.borderOnElevation0};
    padding: 12px 16px;

    :hover {
        background-color: ${({ theme }) => theme.backgroundSurfaceElevation2};
    }
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${spacingsPx.xs};
`;

const AddAccountButtonWrapper = styled.div`
    display: flex;
    margin-left: ${spacingsPx.xs};
    align-items: flex-start;
`;

const Search = styled.div`
    display: flex;
    justify-content: space-between;
    padding: ${spacingsPx.xs};

    background: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
`;

const Heading = styled(H2)<{ isInline?: boolean }>`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    ${props =>
        props.isInline &&
        css`
            font-size: 18px;
        `}
`;

const MenuItemsWrapper = styled.div`
    position: relative;
    width: 100%;
`;

const Scroll = styled.div`
    height: auto;
    overflow: hidden auto;
`;

const ExpandedMobileWrapper = styled.div`
    display: flex;
    position: absolute;
    flex-direction: column;
    background: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
    z-index: ${zIndices.expandableNavigation};
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 10px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_20};
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    padding-bottom: 16px;
`;

export const MobileAccountsMenu = () => {
    const device = useSelector(selectDevice);
    const [isExpanded, setIsExpanded] = useState(false);
    const [animatedIcon, setAnimatedIcon] = useState(false);

    const theme = useTheme();

    const { discovery } = useDiscovery();

    if (!device || !discovery) {
        // TODO: default empty state while retrieving data from the device
        return (
            <Wrapper>
                <Scroll>
                    <MenuHeader />
                </Scroll>
            </Wrapper>
        );
    }

    return (
        <>
            <Wrapper>
                <MenuHeader
                    onClick={() => {
                        setIsExpanded(!isExpanded);
                        setAnimatedIcon(true);
                    }}
                >
                    <Row>
                        <Heading>
                            <Translation id="TR_MY_ACCOUNTS" />
                        </Heading>
                        <Icon
                            canAnimate={animatedIcon}
                            isActive={isExpanded}
                            size={20}
                            color={theme.TYPE_LIGHT_GREY}
                            onClick={() => {
                                setIsExpanded(!isExpanded);
                                setAnimatedIcon(true);
                            }}
                            icon="ARROW_DOWN"
                        />
                    </Row>
                </MenuHeader>
            </Wrapper>

            {isExpanded && (
                <MenuItemsWrapper>
                    <ExpandedMobileWrapper>
                        <Search>
                            <AccountSearchBox />
                            <AddAccountButtonWrapper>
                                <AddAccountButton
                                    device={device}
                                    closeMenu={() => setIsExpanded(false)}
                                />
                            </AddAccountButtonWrapper>
                        </Search>
                        <CoinsFilter />

                        <AccountsList onItemClick={() => setIsExpanded(false)} />
                    </ExpandedMobileWrapper>
                </MenuItemsWrapper>
            )}
        </>
    );
};
