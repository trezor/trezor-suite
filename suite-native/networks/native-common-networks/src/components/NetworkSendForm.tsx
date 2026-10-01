import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import type { NetworkSymbol } from '@suite-common/networks';
import { injectDispatch } from '@suite-common/redux-utils';
import { VStack } from '@suite-native/atoms';
import {
    SendFormAddressInput,
    withSendFormLayout,
} from '@suite-native/network-module-suite-native-sendform-lego-bricks';
import { validateSendField } from '@trezor/network-module-suite-common-types';

import { injectNativeNetworks } from '../NativeNetworksServices';
import {
    type SendFormRootState,
    selectFeeLevel,
    selectSendFormDraft,
    setAddress,
    setField,
} from '../sendFormSlice';

type NetworkSendFormProps = {
    networkSymbol: NetworkSymbol;
};

/**
 * The one send form for every network. It owns the draft state and the validation of declared
 * fields; the network module supplies the declaration, the fee levels and the components that
 * render the network-specific parts, which receive values and callbacks only.
 */
const NetworkSendFormFields = ({ networkSymbol }: NetworkSendFormProps) => {
    const { nativeNetworks, dispatch } = useServices(injectNativeNetworks, injectDispatch);
    const draft = useSelector((state: SendFormRootState) =>
        selectSendFormDraft(state, networkSymbol),
    );
    const send = nativeNetworks.getSend(networkSymbol);

    if (!send) {
        return null;
    }

    const feeLevels = send.strategy.getFeeLevels();
    const selectedFeeLevelId = draft.selectedFeeLevelId ?? feeLevels[0]?.id ?? '';
    const FeeSelector = send.feeSelector;

    return (
        <VStack spacing={24}>
            <SendFormAddressInput
                value={draft.address}
                onChangeText={address => dispatch(setAddress({ networkSymbol, address }))}
            />
            {send.fields.map(({ declaration, component: Field }) => {
                const value = draft.fields[declaration.id] ?? '';

                return (
                    <Field
                        key={declaration.id}
                        value={value}
                        error={validateSendField(declaration, value)}
                        onChange={fieldValue =>
                            dispatch(
                                setField({
                                    networkSymbol,
                                    fieldId: declaration.id,
                                    value: fieldValue,
                                }),
                            )
                        }
                    />
                );
            })}
            {FeeSelector && (
                <FeeSelector
                    levels={feeLevels}
                    selectedLevelId={selectedFeeLevelId}
                    onSelect={feeLevelId => dispatch(selectFeeLevel({ networkSymbol, feeLevelId }))}
                />
            )}
        </VStack>
    );
};

export const NetworkSendForm = withSendFormLayout(NetworkSendFormFields, { title: 'Send' });
