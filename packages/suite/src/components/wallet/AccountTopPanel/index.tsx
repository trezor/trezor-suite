import { FiatValue, Translation, AccountLabeling, TopNavigationPanel } from '@suite-components';
import styled from 'styled-components';
import { useSelector, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { CoinLogo, H1, H2, colors, Dropdown, variables } from '@trezor/components';
import React from 'react';
import { MAX_WIDTH } from '@suite-constants/layout';
import AccountNavigation from './components/AccountNavigation';

const Row = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
`;

const BalanceWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Balance = styled(H1)`
    white-space: nowrap;
    margin-left: 6px;
`;

const FiatBalanceWrapper = styled(H2)`
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-left: 1ch;
`;

const FiatRateWrapper = styled.span`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

// const FlickerAnimation = keyframes`
//     0% {
//         opacity: 1;
//     }
//     50% {
//         opacity: 0;
//     }
//     100% {
//         opacity: 1;
//     }
// `;

// const Col = styled.div`
//     display: flex;
//     align-items: center;
// `;

// const Ticker = styled.div`
//     display: flex;
//     flex-direction: column;
//     min-width: 240px;
//     border-radius: 3px;
//     background: ${colors.BLACK92};
//     padding: 8px 10px;
//     font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
// `;

// const TickerTitle = styled.div`
//     text-transform: uppercase;
//     font-size: ${variables.FONT_SIZE.TINY};
//     color: #a0a0a0;
// `;

// const TickerPrice = styled.div`
//     color: ${colors.BLACK50};
//     font-size: ${variables.FONT_SIZE.NORMAL};
// `;

// const LiveWrapper = styled.div`
//     display: flex;
//     font-size: ${variables.FONT_SIZE.TINY};
//     font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
//     color: ${colors.GREEN};
//     align-items: center;
//     text-transform: uppercase;
//     animation: ${FlickerAnimation} 2s 3;
// `;

// const Live = styled.div`
//     display: flex;
// `;

// const Dot = styled.div`
//     display: flex;
//     width: 6px;
//     height: 6px;
//     background-color: ${colors.GREEN};
//     border-radius: 50%;
//     margin-right: 3px;
//     margin-top: -1px;
// `;

// const LastUpdate = styled.div`
//     text-transform: none;
// `;

// const StyledIcon = styled(Icon)`
//     cursor: pointer;
// `;

const AccountTopPanel = () => {
    const settings = useSelector(state => state.wallet.settings);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    if (selectedAccount.status !== 'loaded') return null;

    const { account } = selectedAccount;
    const { symbol, formattedBalance } = account;
    // const MAX_AGE = 5; // after 5 minutes the ticker will show tooltip with info about last update instead of blinking LIVE text
    // const rateAge = (timestamp: number) => differenceInMinutes(new Date(), new Date(timestamp));
    const dropdownItems = [
        {
            callback: () => goto('wallet-details'),
            label: <Translation id="TR_NAV_DETAILS" />,
            isHidden: account.networkType !== 'bitcoin',
        },
    ];

    return (
        <TopNavigationPanel
            title={<AccountLabeling account={account} />}
            navigation={<AccountNavigation account={account} />}
            dropdown={
                <Dropdown
                    isDisabled={dropdownItems.every(item => item.isHidden)}
                    alignMenu="right"
                    items={dropdownItems}
                />
            }
        >
            <BalanceWrapper>
                <CoinLogo size={24} symbol={symbol} />
                <Balance>
                    {formattedBalance} {symbol.toUpperCase()}
                </Balance>
                <FiatValue amount={account.formattedBalance} symbol={symbol}>
                    {({ value }) =>
                        value ? <FiatBalanceWrapper>≈ {value}</FiatBalanceWrapper> : null
                    }
                </FiatValue>
            </BalanceWrapper>

            <FiatValue amount="1" symbol={symbol}>
                {({ rate }) => (rate ? <FiatRateWrapper>{rate}</FiatRateWrapper> : null)}
            </FiatValue>
        </TopNavigationPanel>
    );

    // return (
    //     <Wrapper title={<Translation id="TR_TRANSACTIONS" />}>
    //         <Col>
    //             <CoinLogo size={24} symbol={symbol} />
    //             <HiddenPlaceholder intensity={7}>
    //                 <Balance>
    //                     {formattedBalance} {symbol.toUpperCase()}
    //                 </Balance>
    //             </HiddenPlaceholder>
    //             {fiatBalance && (
    //                 <HiddenPlaceholder intensity={7}>
    //                     <Badge>
    //                         <FormattedNumber value={fiatBalance} currency={localCurrency} />
    //                     </Badge>
    //                 </HiddenPlaceholder>
    //             )}
    //         </Col>
    //         {!isTestnet(symbol) && (
    //             <Col>
    //                 <Ticker>
    //                     <Row>
    //                         <TickerTitle>
    //                             <Translation {...getTitleForNetwork(symbol)} /> price (
    //                             {symbol.toUpperCase()})
    //                         </TickerTitle>
    //                         <FiatValue amount="1" symbol={symbol}>
    //                             {({ value, timestamp }) =>
    //                                 value && timestamp ? (
    //                                     <>
    //                                         {rateAge(timestamp) >= MAX_AGE ? (
    //                                             <Tooltip
    //                                                 maxWidth={285}
    //                                                 placement="top"
    //                                                 content={
    //                                                     <LastUpdate>
    //                                                         <Translation
    //                                                             {...messages.TR_LAST_UPDATE}
    //                                                             values={{
    //                                                                 value: (
    //                                                                     <FormattedRelativeTime
    //                                                                         value={
    //                                                                             rateAge(timestamp) *
    //                                                                             -60
    //                                                                         }
    //                                                                         numeric="auto"
    //                                                                         updateIntervalInSeconds={
    //                                                                             10
    //                                                                         }
    //                                                                     />
    //                                                                 ),
    //                                                             }}
    //                                                         />
    //                                                     </LastUpdate>
    //                                                 }
    //                                             >
    //                                                 <StyledIcon
    //                                                     icon="QUESTION"
    //                                                     color={colors.BLACK50}
    //                                                     hoverColor={colors.BLACK25}
    //                                                     size={14}
    //                                                 />
    //                                             </Tooltip>
    //                                         ) : (
    //                                             <LiveWrapper key={symbol}>
    //                                                 <Dot />
    //                                                 <Live>
    //                                                     <Translation {...messages.TR_LIVE} />
    //                                                 </Live>
    //                                             </LiveWrapper>
    //                                         )}
    //                                     </>
    //                                 ) : null
    //                             }
    //                         </FiatValue>
    //                     </Row>
    //                     <TickerPrice>
    //                         <FiatValue amount="1" symbol={symbol}>
    //                             {({ value }) => value ?? <NoRatesTooltip />}
    //                         </FiatValue>
    //                     </TickerPrice>
    //                 </Ticker>
    //             </Col>
    //         )}
    //     </Wrapper>
    // );
};

export default AccountTopPanel;
