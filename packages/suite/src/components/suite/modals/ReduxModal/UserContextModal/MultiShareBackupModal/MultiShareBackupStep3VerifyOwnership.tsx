import { BackupInstructionsStep } from './BackupInstructionsStep';
import {
    InstructionBaseConfig,
    createSharesInstruction,
    verifyTrezorOwnershipInstruction,
} from './instructionSteps';

export const MultiShareBackupStep3VerifyOwnership = () => {
    const instructions: InstructionBaseConfig[] = [
        verifyTrezorOwnershipInstruction,
        {
            ...createSharesInstruction,
            description: undefined,
            children: null,
            completeness: 'todo',
        },
    ];

    return instructions.map((content, i) => (
        <BackupInstructionsStep
            key={i}
            stepNumber={i + 1}
            isLast={instructions.length === i + 1}
            {...content}
        />
    ));
};
