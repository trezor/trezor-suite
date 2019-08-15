import React from 'react';
import styled from 'styled-components';
import { FormattedMessage, injectIntl, InjectedIntl, InjectedIntlProps } from 'react-intl';
import { Button, Input } from '@trezor/components';
// import VerifyAddressTooltip from '@wallet-components/tooltips/VerifyAddressTooltip';
import commonMessages from '@wallet-views/messages';
import messages from './messages';
import { AppState } from '@suite-types';
// import { CONTEXT_DEVICE } from 'actions/constants/modal';

const Wrapper = styled.div`
    display: flex;

    @media screen and (max-width: 795px) {
        flex-wrap: wrap;
    }
`;

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
        width: 100%;
        margin-top: 10px;
        align-self: auto;
        border-radius: 3px;
    }
`;

interface Props extends InjectedIntlProps {
    account: AppState['wallet']['selectedAccount']['account'];
    address: string;
    isAddressVerifying: boolean;
    isAddressUnverified: boolean;
    isAddressHidden: boolean;
    isAddressVerified: boolean;
}

const VerifyInput = ({
    account,
    address,
    // @ts-ignore
    device,
    isAddressHidden,
    isAddressVerified,
    isAddressUnverified,
    isAddressVerifying,
    // @ts-ignore
    showAddress,
    intl,
}: Props) => {
    return (
        <Wrapper>
            <Input
                type="text"
                readOnly
                topLabel={intl.formatMessage(commonMessages.TR_ADDRESS)}
                value={address}
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
                        <EyeButton isTransparent onClick={() => showAddress(account.path)}>
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
                                icon={isAddressUnverified ? "EYE_CROSSED" : "EYE"}
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
                        onClick={() => showAddress(account.path)}
                        // isDisabled={device.connected && !discovery.completed}
                        icon="EYE"
                    >
                        <FormattedMessage {...messages.TR_SHOW_FULL_ADDRESS} />
                    </ShowAddressButton>
                )}
            </>
        </Wrapper>
    );
};

export default injectIntl(VerifyInput);
