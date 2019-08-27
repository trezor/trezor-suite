import React from 'react';
import styled from 'styled-components';
import { FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import { Button, Input, Tooltip, Icon, colors } from '@trezor/components';
import VerifyAddressTooltip from '@wallet-components/tooltips/VerifyAddressTooltip';
import commonMessages from '@wallet-views/messages';
import DeviceIcon from '@suite-components/images/DeviceIcon';
import { ReceiveProps } from '@suite/views/wallet/account/receive';
import messages from './messages';
import ShowOnTrezorEyeButton from '../../ShowOnTrezorEyeButton';

const Wrapper = styled.div`
    display: flex;

    @media screen and (max-width: 795px) {
        flex-wrap: wrap;
    }
`;

const EyeButton = styled(ShowOnTrezorEyeButton)`
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

const StyledDeviceIcon = styled(DeviceIcon)`
    margin-right: 6px;
`;

interface Props
    extends Pick<
            ReceiveProps,
            | 'isAddressVerifying'
            | 'isAddressUnverified'
            | 'isAddressHidden'
            | 'isAddressVerified'
            | 'showAddress'
            | 'device'
        >,
        InjectedIntlProps {
    accountPath: string;
    accountAddress: string;
}

const VerifyInput = ({
    accountPath,
    accountAddress,
    device,
    isAddressHidden,
    isAddressVerified,
    isAddressUnverified,
    isAddressVerifying,
    showAddress,
    intl,
}: Props) => {
    return (
        <Wrapper>
            <Input
                type="text"
                readOnly
                topLabel={intl.formatMessage(commonMessages.TR_ADDRESS)}
                value={accountAddress}
                isPartiallyHidden={isAddressHidden}
                tooltipAction={
                    isAddressVerifying ? (
                        <React.Fragment>
                            <StyledDeviceIcon size={16} device={device} color={colors.WHITE} />
                            <FormattedMessage {...messages.TR_CHECK_ADDRESS_ON_TREZOR} />
                        </React.Fragment>
                    ) : null
                }
                icon={
                    (isAddressVerified || isAddressUnverified) &&
                    !isAddressVerifying && (
                        <EyeButton
                            device={device}
                            accountPath={accountPath}
                            isAddressVerifying={isAddressVerifying}
                            isAddressUnverified={isAddressUnverified}
                            isAddressHidden={isAddressHidden}
                            isAddressVerified={isAddressVerified}
                            showAddress={showAddress}
                        />
                    )
                }
            />
            <>
                {!(isAddressVerified || isAddressUnverified) && ( // !account.imported
                    <ShowAddressButton
                        onClick={() => showAddress(accountPath)}
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
