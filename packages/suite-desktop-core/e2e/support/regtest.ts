/* eslint-disable no-console */

// TODO: future coinjoin-backend-link package? similar to trezor-user-env-link

export const sendToAddress = ({ address, amount }: { address: string; amount: string }) =>
    fetch('http://localhost:8081/send_to_address', {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
        body: `amount=${amount}&address=${address}`,
        method: 'POST',
    });

export const generateBlock = () =>
    fetch('http://localhost:8081/generate_block', {
        method: 'GET',
    });

export const waitForCoinjoinBackend = () =>
    new Promise<void>(async (resolve, reject) => {
        const limit = 60;
        const error = '';

        console.log('waiting for coinjoin backend');

        for (let i = 0; i < limit; i++) {
            if (i === limit - 1) {
                console.log(`waiting for coinjoin backend: ${error}\n`);
            }

            await new Promise(resolve => setTimeout(() => resolve(undefined), 1000));

            try {
                const res = await fetch('http://localhost:19121/');
                if (res.status === 200) {
                    console.log('coinjoin backend is online');
                    return resolve();
                }
            } catch (err) {
                process.stdout.write('.');
            }
        }

        reject(error);
    });
