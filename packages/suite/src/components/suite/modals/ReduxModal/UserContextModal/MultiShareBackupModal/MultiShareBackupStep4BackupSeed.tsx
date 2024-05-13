import { BackupInstructionsStep } from './BackupInstructionsStep';
import {
    InstructionBaseConfig,
    createSharesInstruction,
    verifyTrezorOwnershipInstruction,
} from './instructionSteps';

export const MultiShareBackupStep4BackupSeed = () => {
    const instructions: InstructionBaseConfig[] = [
        {
            ...verifyTrezorOwnershipInstruction,
            description: undefined,
            children: null,
            completeness: 'done',
        },
        createSharesInstruction,
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
