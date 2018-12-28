/* @flow */

import * as React from 'react';
import styled from 'styled-components';
import colors from 'config/colors';

import Input from 'components/inputs/Input';
import Tooltip from 'components/Tooltip';
import Icon from 'components/Icon';
import ICONS from 'config/icons';

import type { Props as BaseProps } from '../../Container';

type Props = BaseProps & {
    children: React.Node,
}

// TODO: Decide on a small screen width for the whole app
// and put it inside config/variables.js
// same variable also in "AccountSend/index.js"
const SmallScreenWidth = '850px';

const InputLabelWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const AdvancedSettingsWrapper = styled.div`
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    border-top: 1px solid ${colors.DIVIDER};
`;

const GasInputRow = styled.div`
    width: 100%;
    display: flex;

    @media screen and (max-width: ${SmallScreenWidth}) {
        flex-direction: column;
    }
`;

const GasInput = styled(Input)`
    /* min-height: 85px; */
    padding-bottom: 28px;
    &:first-child {
        padding-right: 20px;
    }

    @media screen and (max-width: ${SmallScreenWidth}) {
        &:first-child {
            padding-right: 0;
        }
    }
`;

const AdvancedSettingsSendButtonWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: flex-end;
`;

const getFeeInputState = (feeErrors: string, feeWarnings: string): string => {
    let state = '';
    if (feeWarnings && !feeErrors) {
        state = 'warning';
    }
    if (feeErrors) {
        state = 'error';
    }
    return state;
};

const Left = styled.div`
    display: flex;
    align-items: center;
`;

// stateless component
const AdvancedForm = (props: Props) => {
    const {
        network,
    } = props.selectedAccount;
    if (!network) return null;
    const {
        errors,
        warnings,
        infos,
        fee,
    } = props.sendForm;
    const {
        onFeeChange,
    } = props.sendFormActions;

    return (
        <AdvancedSettingsWrapper>
            <GasInputRow>
                <GasInput
                    state={getFeeInputState(errors.fee, warnings.fee)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    topLabel={(
                        <InputLabelWrapper>
                            <Left>
                            Fee
                                <Tooltip
                                    content={(
                                        <React.Fragment>
                                        TODO: explain fee in XRP drops
                                        </React.Fragment>
                                    )}
                                    maxWidth={410}
                                    readMoreLink="https://wiki.trezor.io/Ethereum_Wallet#Gas_limit"
                                    placement="top"
                                >
                                    <Icon
                                        icon={ICONS.HELP}
                                        color={colors.TEXT_SECONDARY}
                                        size={24}
                                    />
                                </Tooltip>
                            </Left>
                        </InputLabelWrapper>
                    )}
                    bottomText={errors.fee || warnings.fee || infos.fee}
                    value={fee}
                    onChange={event => onFeeChange(event.target.value)}
                />
            </GasInputRow>

            <AdvancedSettingsSendButtonWrapper>
                { props.children }
            </AdvancedSettingsSendButtonWrapper>
        </AdvancedSettingsWrapper>
    );
};

export default AdvancedForm;