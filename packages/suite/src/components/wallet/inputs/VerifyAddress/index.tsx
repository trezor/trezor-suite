import React from 'react';
import styled from 'styled-components';
import { FormattedMessage, injectIntl, InjectedIntl } from 'react-intl';
import { Button, Input, icons as ICONS } from '@trezor/components';
// import VerifyAddressTooltip from '@wallet-components/tooltips/VerifyAddressTooltip';
import commonMessages from '@wallet-views/messages';
import messages from './messages';

const Wrapper = styled.div``;

const EyeButton = styled(Button)`
    z-index: 10001;
    padding: 0;
    top: 10px;
    position: absolute;
    right: 10px;

    &:hover {
        background: transparent;
    }
`;

const ShowAddressButton = styled(Button)`
    white-space: nowrap;
    display: flex;
    height: 40px;
    align-items: center;
    align-self: flex-end;
    justify-content: center;

    border-top-left-radius: 0;
    border-bottom-left-radius: 0;

    @media screen and (max-width: 795px) {
        margin-top: 10px;
        align-self: auto;
        border-radius: 3px;
    }
`;

interface Props {
    address: string;
    topLabel: string;
    accountPath: string;
    isAddressVerifying: boolean;
    isAddressUnverified: boolean;
    isAddressHidden: boolean;
    isAddressVerified: boolean;
    intl: InjectedIntl;
}

const VerifyInput = ({
    // @ts-ignore
    account,
    // @ts-ignore
    device,
    isAddressHidden,
    isAddressVerified,
    isAddressUnverified,
    isAddressVerifying,
    // @ts-ignore
    showAddress,
    intl,
}: Props) => (
    <Wrapper>
        <Input
            type="text"
            readOnly
            topLabel={intl.formatMessage(commonMessages.TR_ADDRESS)}
            value="address"
            isPartiallyHidden={isAddressHidden}
            tooltipAction={
                isAddressVerifying ? (
                    <React.Fragment>
                        {/* <StyledDeviceIcon size={16} device={device} color={colors.WHITE} /> */}
                        <FormattedMessage {...messages.TR_CHECK_ADDRESS_ON_TREZOR} />
                    </React.Fragment>
                ) : null
            }
            icon={
                (isAddressVerified || isAddressUnverified) &&
                !isAddressVerifying && (
                    <EyeButton isTransparent onClick={() => showAddress(account.accountPath)}>
                        {/* <Tooltip
                            placement="top"
                            content={
                                <VerifyAddressTooltip
                                    isConnected={device.connected}
                                    isAvailable={device.available}
                                    addressUnverified={isAddressUnverified}
                                />
                            }
                        >
                            <Icon
                                size={16}
                                icon={isAddressUnverified ? ICONS.EYE_CROSSED : ICONS.EYE}
                                color={
                                    isAddressUnverified ? colors.ERROR_PRIMARY : colors.TEXT_PRIMARY
                                }
                            />
                        </Tooltip> */}
                    </EyeButton>
                )
            }
        />
        <>
            {!(isAddressVerified || isAddressUnverified) && ( // !account.imported
                <ShowAddressButton
                    onClick={() => showAddress(account.accountPath)}
                    // isDisabled={device.connected && !discovery.completed}
                    icon={ICONS.EYE}
                >
                    <FormattedMessage {...messages.TR_SHOW_FULL_ADDRESS} />
                </ShowAddressButton>
            )}
        </>
    </Wrapper>
);

export default injectIntl(VerifyInput);
