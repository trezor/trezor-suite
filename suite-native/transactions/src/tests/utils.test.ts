import { mapTransactionInputsOutputsToAddresses, sortTargetAddressesToBeginning } from '../utils';
import { transactionWithTargetInOutputs } from './fixtures/transactions';

describe('mapTransactionInputsOutputsToAddresses', () => {
    test('should return an empty array when input is empty', () => {
        expect(mapTransactionInputsOutputsToAddresses([])).toEqual([]);
    });

    test('should return correct concatenated non-null addresses for transaction inputs', () => {
        const expectedOutput = [
            'bc1q39kuc35n722fmy0nw3qqhpvg0ch8f0a6rt22xs',
            'bc346cd7c787e903ac4b41e4fd2e038a81cb696d5dbf87',
        ];
        expect(
            mapTransactionInputsOutputsToAddresses(transactionWithTargetInOutputs.details.vin),
        ).toEqual(expectedOutput);
    });

    test('should return correct concatenated non-null addresses for Target input', () => {
        const expectedOutput = [
            '3BcXPstZ4ZHhvLxPFkjFocuFySKt8nsGgs',
            '3QpCQP3A2q7kCr8QgsWuqG1Bg1P6RySonw',
        ];
        expect(
            mapTransactionInputsOutputsToAddresses(transactionWithTargetInOutputs.details.vout),
        ).toEqual(expectedOutput);
    });
});

describe('sortTargetAddressesToBeginning', () => {
    test('should return an empty array when both inputs and targets are empty', () => {
        expect(sortTargetAddressesToBeginning([], [])).toEqual([]);
    });

    test('should return empty array if only targets are present', () => {
        const targetAddresses = mapTransactionInputsOutputsToAddresses(
            transactionWithTargetInOutputs.targets,
        );

        expect(sortTargetAddressesToBeginning([], targetAddresses)).toEqual([]);
    });

    test('should return unchanged transaction inputs if targets not present', () => {
        const inputAddresses = mapTransactionInputsOutputsToAddresses(
            transactionWithTargetInOutputs.details.vin,
        );

        expect(sortTargetAddressesToBeginning(inputAddresses, [])).toEqual(inputAddresses);
    });

    test('should return unchanged transaction inputs if targets are not included', () => {
        const inputAddresses = mapTransactionInputsOutputsToAddresses(
            transactionWithTargetInOutputs.details.vin,
        );
        const targetAddresses = mapTransactionInputsOutputsToAddresses(
            transactionWithTargetInOutputs.targets,
        );

        expect(sortTargetAddressesToBeginning(inputAddresses, targetAddresses)).toEqual(
            inputAddresses,
        );
    });

    test('should targets at the beginning of the array', () => {
        const outputAddresses = mapTransactionInputsOutputsToAddresses(
            transactionWithTargetInOutputs.details.vout,
        );
        const targetAddresses = mapTransactionInputsOutputsToAddresses(
            transactionWithTargetInOutputs.targets,
        );

        const expectedResult = [
            '3QpCQP3A2q7kCr8QgsWuqG1Bg1P6RySonw',
            '3BcXPstZ4ZHhvLxPFkjFocuFySKt8nsGgs',
        ];

        expect(sortTargetAddressesToBeginning(outputAddresses, targetAddresses)).toEqual(
            expectedResult,
        );
    });
});
