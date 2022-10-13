import { Round } from '../../src/types/coordinator';

export const DEFAULT_ROUND = {
    id: '80b4e3efd1aedeb7b140d605946ca5662241d6829b6018bb0eee58c9ac929fce',
    blameOf: '0000000000000000000000000000000000000000000000000000000000000000',
    amountCredentialIssuerParameters: {
        cw: '03CFB034383C718F51182773D3AE90C0826DB752330462CAD73F81A7F0AA3CBB6C',
        i: '032988176AD16B5414F15B44BACFE4C584AEB1D1851614BF6C614CBC5C8B9F4DC7',
    },
    vsizeCredentialIssuerParameters: {
        cw: '025E28EC14AA222CF90B00E564D3572806B7449DDB830A392257D4B9C89A4A5FAE',
        i: '0395DFD855C84500B656BD11EB9A185FA1719F8F8C93890B836FDCB40ABEB1E454',
    },
    phase: 0,
    endRoundState: 0,
    coinjoinState: {
        events: [
            {
                Type: 'RoundCreated',
                roundParameters: {
                    miningFeeRate: 129000,
                    coordinationFeeRate: {
                        rate: 0.003,
                        plebsDontPayThreshold: 1000000,
                    },
                    allowedInputAmounts: {
                        min: 5000,
                        max: 134375000000,
                    },
                    allowedOutputAmounts: {
                        min: 5000,
                        max: 134375000000,
                    },
                    allowedInputScriptTypes: ['P2WPKH', 'Taproot'],
                    allowedOutputScriptTypes: ['P2WPKH', 'Taproot'],
                    standardInputRegistrationTimeout: '0d 0h 1m 0s',
                    connectionConfirmationTimeout: '0d 0h 1m 0s',
                    outputRegistrationTimeout: '0d 0h 1m 0s',
                    transactionSigningTimeout: '0d 0h 1m 0s',
                    blameInputRegistrationTimeout: '0d 0h 1m 0s',
                    maxSuggestedAmount: 1000000000,
                    minInputCountByRound: 2,
                    maxInputCountByRound: 10,
                    minAmountCredentialValue: 5000,
                    maxAmountCredentialValue: 134375000000,
                    initialInputVsizeAllocation: 99942,
                    maxVsizeCredentialValue: 255,
                    maxVsizeAllocationPerAlice: 255,
                    maxTransactionSize: 100000,
                    minRelayTxFee: 1000,
                },
            },
        ],
    },
    inputRegistrationEnd: new Date().toUTCString() + 10000,
} as Round;
