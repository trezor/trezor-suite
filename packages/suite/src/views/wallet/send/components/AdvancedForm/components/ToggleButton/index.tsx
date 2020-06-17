import React from 'react';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { variables, colors, Icon } from '@trezor/components';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';

const Wrapper = styled.div`
    display: flex;
    min-height: 41px;
    align-items: center;
    justify-content: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.BLACK17};
`;

const ToggleIcon = styled(Icon)`
    margin-left: 5px;
`;

const Text = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
`;

export default () => {
    const { advancedForm, showAdvancedForm } = useSendContext();

    return (
        <Wrapper>
            <Text
                onClick={() => {
                    if (advancedForm) {
                        showAdvancedForm(false);
                    } else {
                        showAdvancedForm(true);
                    }
                }}
            >
                {advancedForm ? (
                    <Translation id="TR_HIDE_ADVANCED_OPTIONS" />
                ) : (
                    <Translation id="TR_SHOW_ADVANCED_OPTIONS" />
                )}
                <ToggleIcon
                    icon="ARROW_DOWN"
                    color={colors.BLACK17}
                    size={20}
                    isActive={advancedForm}
                    canAnimate={advancedForm}
                />
            </Text>
        </Wrapper>
    );
};
