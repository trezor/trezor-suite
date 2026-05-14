import readline from 'readline';

export const stdioManager = () => {
    let readInterface: readline.Interface | undefined;

    return (promptText: string) => {
        if (readInterface) {
            readInterface.close();
        }

        readInterface = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const rl = readInterface;

        return {
            promise: new Promise<string>(resolve => {
                setTimeout(() => {
                    rl.question(promptText + ' ', (answer: any) => {
                        rl.close();
                        resolve(answer);
                    });
                }, 10);
            }),
        };
    };
};
