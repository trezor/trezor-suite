import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { Translation, useTranslation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { type TrxStats } from '@suite-common/earn-staking-api';
import { injectAddressValidator } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    Button,
    Card,
    Checkbox,
    Column,
    IconButton,
    Input,
    Modal,
    Row,
    Table,
} from '@trezor/components';
import { PlusIcon, TrashIcon } from '@trezor/icons';

import { TronRepresentativeApr } from './TronRepresentativeApr';
import { TronRepresentativeCell } from './TronRepresentativeCell';
import { TronVoteAprLabel } from './TronVoteAprLabel';

type CustomRepresentative = {
    id: number;
    address: string;
    isSelected: boolean;
};

interface TronSelectRepresentativesModalProps {
    symbol: NetworkSymbol;
    selectedAddresses: string[];
    representatives: TrxStats | undefined;
    onConfirm: (addresses: string[]) => void;
    onClose: () => void;
}

export const TronSelectRepresentativesModal = ({
    symbol,
    selectedAddresses,
    representatives,
    onConfirm,
    onClose,
}: TronSelectRepresentativesModalProps) => {
    const { translationString } = useTranslation();
    const { addressValidator } = useServices(injectAddressValidator);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    const knownAddresses = (representatives ?? []).map(({ address }) => address);

    const [selectedKnownAddresses, setSelectedKnownAddresses] = useState(() =>
        selectedAddresses.filter(address => knownAddresses.includes(address)),
    );
    const [customRepresentatives, setCustomRepresentatives] = useState<CustomRepresentative[]>(() =>
        selectedAddresses
            .filter(address => !knownAddresses.includes(address))
            .map((address, index) => ({ id: index, address, isSelected: true })),
    );

    const nextCustomIdRef = useRef(customRepresentatives.length);

    const toggleKnownAddress = (address: string) => {
        setSelectedKnownAddresses(current =>
            current.includes(address)
                ? current.filter(selectedAddress => selectedAddress !== address)
                : [...current, address],
        );
    };

    const addCustomRepresentative = () => {
        const id = nextCustomIdRef.current;
        nextCustomIdRef.current += 1;

        setCustomRepresentatives(current => [...current, { id, address: '', isSelected: true }]);
    };

    const updateCustomRepresentative = (id: number, changes: Partial<CustomRepresentative>) => {
        setCustomRepresentatives(current =>
            current.map(representative =>
                representative.id === id ? { ...representative, ...changes } : representative,
            ),
        );
    };

    const removeCustomRepresentative = (id: number) => {
        setCustomRepresentatives(current =>
            current.filter(representative => representative.id !== id),
        );
    };

    const getCustomAddressError = ({ id, address }: CustomRepresentative): string | undefined => {
        const trimmedAddress = address.trim();

        if (!trimmedAddress) {
            return undefined;
        }

        if (!addressValidator.isAddressValid(trimmedAddress, symbol)) {
            return translationString('RECIPIENT_IS_NOT_VALID');
        }

        const isDuplicate =
            selectedKnownAddresses.includes(trimmedAddress) ||
            customRepresentatives.some(
                other =>
                    other.id !== id && other.isSelected && other.address.trim() === trimmedAddress,
            );

        return isDuplicate
            ? translationString('TR_EARN_TRON_REPRESENTATIVE_ALREADY_SELECTED')
            : undefined;
    };

    const filledCustomRepresentatives = customRepresentatives.filter(
        ({ isSelected, address }) => isSelected && address.trim() !== '',
    );
    const canConfirm = filledCustomRepresentatives.every(
        representative => getCustomAddressError(representative) === undefined,
    );

    const canAddCustomRepresentative = customRepresentatives.every(
        representative =>
            !representative.isSelected ||
            (representative.address.trim() !== '' &&
                getCustomAddressError(representative) === undefined),
    );

    const handleConfirm = () => {
        onConfirm([
            ...knownAddresses.filter(address => selectedKnownAddresses.includes(address)),
            ...filledCustomRepresentatives.map(({ address }) => address.trim()),
        ]);
    };

    return (
        <Modal
            width={600}
            heading={<Translation id="TR_EARN_TRON_SELECT_REPRESENTATIVES" />}
            description={<Translation id="TR_EARN_TRON_SELECT_REPRESENTATIVES_DESCRIPTION" />}
            onCancel={onClose}
            bottomContent={
                <>
                    <Modal.Button onClick={handleConfirm} isDisabled={!canConfirm}>
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onClose}>
                        <Translation id="TR_CLOSE" />
                    </Modal.Button>
                </>
            }
        >
            <Card paddingType="none">
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell>
                                <Translation id="TR_EARN_TRON_REPRESENTATIVE" />
                            </Table.Cell>
                            <Table.Cell align="end">
                                <TronVoteAprLabel />
                            </Table.Cell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {(representatives ?? []).map(({ address }) => (
                            <Table.Row key={address}>
                                <Table.Cell>
                                    <Checkbox
                                        isChecked={selectedKnownAddresses.includes(address)}
                                        onChange={() => toggleKnownAddress(address)}
                                        verticalAlignment="center"
                                    >
                                        <TronRepresentativeCell
                                            address={address}
                                            representatives={representatives}
                                            isAddressShown
                                        />
                                    </Checkbox>
                                </Table.Cell>
                                <Table.Cell align="end">
                                    <TronRepresentativeApr
                                        address={address}
                                        representatives={representatives}
                                    />
                                </Table.Cell>
                            </Table.Row>
                        ))}

                        {customRepresentatives.map(representative => {
                            const error = getCustomAddressError(representative);
                            const toggleCustomRepresentative = () =>
                                updateCustomRepresentative(representative.id, {
                                    isSelected: !representative.isSelected,
                                });

                            if (!isDebugModeActive) {
                                return (
                                    <Table.Row key={representative.id}>
                                        <Table.Cell colSpan={2}>
                                            <Checkbox
                                                isChecked={representative.isSelected}
                                                onChange={toggleCustomRepresentative}
                                                verticalAlignment="center"
                                            >
                                                <TronRepresentativeCell
                                                    address={representative.address}
                                                    representatives={representatives}
                                                    isAddressShown
                                                />
                                            </Checkbox>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            }

                            return (
                                <Table.Row key={representative.id}>
                                    <Table.Cell colSpan={2}>
                                        <Row gap={12} alignItems="center" width="100%">
                                            <Checkbox
                                                isChecked={representative.isSelected}
                                                onChange={toggleCustomRepresentative}
                                                verticalAlignment="center"
                                            />
                                            <Column flex="1">
                                                <Input
                                                    value={representative.address}
                                                    onChange={event =>
                                                        updateCustomRepresentative(
                                                            representative.id,
                                                            { address: event.target.value },
                                                        )
                                                    }
                                                    placeholder={translationString(
                                                        'TR_EARN_TRON_ENTER_REPRESENTATIVE_ADDRESS',
                                                    )}
                                                    hasError={error !== undefined}
                                                    bottomText={error}
                                                    size="small"
                                                />
                                            </Column>
                                            <IconButton
                                                icon={TrashIcon}
                                                size="small"
                                                intent="neutral"
                                                priority="secondary"
                                                onClick={() =>
                                                    removeCustomRepresentative(representative.id)
                                                }
                                                tooltip={{
                                                    content: <Translation id="TR_REMOVE" />,
                                                }}
                                            />
                                        </Row>
                                    </Table.Cell>
                                </Table.Row>
                            );
                        })}

                        {isDebugModeActive && (
                            <Table.Row>
                                <Table.Cell colSpan={2} align="center">
                                    <Row justifyContent="center">
                                        <DebugOnlyBadge>
                                            <Button
                                                intent="neutral"
                                                priority="secondary"
                                                size="small"
                                                iconLeft={PlusIcon}
                                                onClick={addCustomRepresentative}
                                                isDisabled={!canAddCustomRepresentative}
                                            >
                                                <Translation id="TR_EARN_TRON_ADD_REPRESENTATIVE" />
                                            </Button>
                                        </DebugOnlyBadge>
                                    </Row>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </Card>
        </Modal>
    );
};
