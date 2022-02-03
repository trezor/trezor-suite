import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/build';
import { Loader } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import { ExtendedMessageDescriptor } from '@suite-types';
import { Translation } from '@suite-components';

interface SavingsSetupGuideListItemProps {
    isBulletPointHidden?: boolean;
}

const Wrapper = styled.div`
    width: 221px;
    background: rgba(196, 196, 196, 0.1);
    height: 100%;
    border-radius: 12px 0 0 12px;
`;

const SavingsSetupGuideList = styled.ol`
    font-size: 16px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    list-style-position: inside;
    counter-reset: item;
    list-style-type: none;
    margin: 15px 15px;
`;

const SavingsSetupGuideListItem = styled.li<SavingsSetupGuideListItemProps>`
    width: 100%;
    height: 46px;
    padding: 12px 0 10px 15px;
    display: flex;
    align-items: center;
    &::before {
        display: block;
        visibility: ${props => (props.isBulletPointHidden ? 'hidden' : 'visible')};
        width: ${props => (props.isBulletPointHidden ? '0' : '20px')};
        color: ${props => props.theme.TYPE_LIGHT_GREY};
        opacity: 0.5;
        counter-increment: item;
        content: counter(item);
        text-align: left;
        margin-right: ${props => (props.isBulletPointHidden ? '0' : '4px')};
    }

    &:not(&.isSelected ~ &):not(&.isSelected) {
        &::before {
            line-height: 28px;
            height: 23px;
            margin-left: ${props => (props.isBulletPointHidden ? '0' : '-4px')};
            margin-right: ${props => (props.isBulletPointHidden ? '0' : '8px')};
            content: url(${resolveStaticPath('images/svg/check.svg')});
        }
    }

    &.isSelected {
        background: ${props => props.theme.BG_WHITE};
        box-shadow: 0px 1px 12px rgba(0, 0, 0, 0.05);
        border-radius: 10px;
        color: ${props => props.theme.TYPE_GREEN};
    }
`;

const StyledLoader = styled(Loader)`
    margin-left: -4px;
    margin-right: 8px;
    width: 20px;
`;

const SavingsSteps = () => {
    const { isWatchingKYCStatus, currentRouteName } = useSelector(state => ({
        isWatchingKYCStatus: state.wallet.coinmarket.savings.isWatchingKYCStatus,
        currentRouteName: state.router.route?.name,
    }));

    if (!currentRouteName) {
        return null;
    }

    const steps = {
        TR_SAVINGS_GUIDE_STEP_YOUR_CREDENTIALS: {
            isBulletPointHidden: false,
            className: ['wallet-invity-registration', 'wallet-invity-user-info'].includes(
                currentRouteName,
            )
                ? 'isSelected'
                : '',
        },
        TR_SAVINGS_GUIDE_STEP_YOUR_PHONE_NUMBER: {
            isBulletPointHidden: false,
            className:
                currentRouteName === 'wallet-invity-phone-number-verification' ? 'isSelected' : '',
        },
        TR_SAVINGS_GUIDE_STEP_KYC_VERIFICATION: {
            isBulletPointHidden: isWatchingKYCStatus,
            className: currentRouteName === 'wallet-invity-kyc-start' ? 'isSelected' : '', // TODO: or KYC failed route name
        },
        TR_SAVINGS_GUIDE_STEP_AML: {
            isBulletPointHidden: false,
            className: currentRouteName === 'wallet-invity-aml' ? 'isSelected' : '',
        },
        TR_SAVINGS_GUIDE_STEP_DCA_SETUP: {
            isBulletPointHidden: false,
            className: [
                'wallet-coinmarket-savings-setup',
                'wallet-coinmarket-savings-payment-info',
            ].includes(currentRouteName)
                ? 'isSelected'
                : '',
        },
    } as const;
    console.log('currentRouteName', currentRouteName);
    return (
        <Wrapper>
            <SavingsSetupGuideList>
                {Object.entries(steps).map(([key, value]) => (
                    <SavingsSetupGuideListItem key={key} {...value}>
                        {value.isBulletPointHidden && <StyledLoader size={16} />}
                        <Translation id={key as ExtendedMessageDescriptor['id']} />
                    </SavingsSetupGuideListItem>
                ))}
            </SavingsSetupGuideList>
        </Wrapper>
    );
};

export default SavingsSteps;
