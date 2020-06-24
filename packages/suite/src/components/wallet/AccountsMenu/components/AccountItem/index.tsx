import React, { forwardRef } from 'react';
import { CoinLogo, colors, variables } from '@trezor/components';
import styled, { css } from 'styled-components';
import { getTitleForNetwork } from '@wallet-utils/accountUtils';
import { Translation, FiatValue } from '@suite-components';
import { CoinBalance } from '@wallet-components';
import { Props } from './Container';

// position: inherit - get position from parent (AccountGroup), it will be set after animation ends
// sticky top: 34, sticky header
const Wrapper = styled.div<{ selected: boolean; type: string }>`
    /* padding: 2px 0px 2px 0px; */
    display: flex;
    flex-direction: column;
    &:first-of-type {
        padding-top: 0;
    }
    ${props =>
        props.selected &&
        css`
            border-radius: 4px;
            background: ${colors.NEUE_BG_GRAY};
            position: inherit;
            top: ${props.type !== 'normal' ? '34px' : '0px'};
            bottom: 0px;
            z-index: 1;
            padding: 0px;
        `}
`;

const Left = styled.div`
    display: flex;
    padding-top: 3px;
`;
const Right = styled.div`
    display: flex;
    flex-direction: column;
    margin-left: 8px;
`;

const Row = styled.div`
    display: flex;
    align-items: center;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const AccountName = styled.div`
    display: flex;
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    line-height: 1.5;
`;

const Balance = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    line-height: 1.57;
`;

const FiatValueWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    line-height: 1.57;
`;

const AccountHeader = styled.div`
    display: flex;
    padding: 12px 16px;
    border-radius: 4px;
    cursor: pointer;
`;

// Using `React.forwardRef` to be able to pass `ref` (item) TO parent (Menu/index)
const AccountItem = forwardRef((props: Props, ref: React.Ref<HTMLDivElement>) => {
    const { account, selected } = props;

    const accountLabel = props.labeling[`account:${account.descriptor}`] ? (
        <span>{props.labeling[`account:${account.descriptor}`]}</span>
    ) : (
        <>
            <Translation {...getTitleForNetwork(account.symbol)} />
            <span>&nbsp;#{account.index + 1}</span>
        </>
    );

    return (
        <Wrapper selected={selected} type={account.accountType} ref={ref}>
            <AccountHeader
                onClick={() =>
                    props.goto('wallet-index', {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    })
                }
            >
                <Left>
                    <CoinLogo size={16} symbol={account.symbol} />
                </Left>
                <Right>
                    <Row>
                        <AccountName>{accountLabel}</AccountName>
                    </Row>
                    <Row>
                        <Balance>
                            <CoinBalance value={account.formattedBalance} symbol={account.symbol} />
                        </Balance>
                    </Row>
                    <Row>
                        <FiatValue
                            amount={account.formattedBalance}
                            symbol={account.symbol}
                            showApproximationIndicator
                        >
                            {({ value }) =>
                                value ? <FiatValueWrapper>{value}</FiatValueWrapper> : null
                            }
                        </FiatValue>
                    </Row>
                </Right>
            </AccountHeader>
        </Wrapper>
    );
});

export default AccountItem;
