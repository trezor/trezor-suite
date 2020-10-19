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
            top: ${props.type !== 'normal'
                ? '50px'
                : '0px'}; /* when scrolling keep some space above to fit account group (50px is the height of acc group container)  */
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
    padding-left: 8px;
    overflow: hidden;
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
    font-variant-numeric: tabular-nums;
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

    const dataTestKey = `@account-menu/${account.symbol}/${account.accountType}/${account.index}`;

    const DefaultLabel = () => (
        <>
            <Translation {...getTitleForNetwork(account.symbol)} />
            <span>&nbsp;#{account.index + 1}</span>
        </>
    );

    const accountLabel = account.metadata.accountLabel ? (
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {account.metadata.accountLabel}
        </span>
    ) : (
        <DefaultLabel />
    );

    return (
        <Wrapper selected={selected} type={account.accountType} ref={ref}>
            <AccountHeader
                onClick={() => {
                    props.closeMenu();
                    props.goto('wallet-index', {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    });
                }}
                data-test={dataTestKey}
            >
                <Left>
                    <CoinLogo size={16} symbol={account.symbol} />
                </Left>
                <Right>
                    <Row>
                        <AccountName data-test={`${dataTestKey}/label`}>{accountLabel}</AccountName>
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
