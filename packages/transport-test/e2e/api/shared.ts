const log = (level: 'debug' | 'info' | 'success' | 'error', ...args: any) => {
    if (typeof window !== 'undefined') {
        // append logs to div class "logs" element
        const logs = document.querySelector('.logs');
        if (logs) {
            logs.innerHTML += `<p style="${level === 'debug' ? 'margin-left:20px;font-size:10px' : ''}">${level === 'success' ? '✅ ' : level === 'error' ? '❌ ' : ''}${args.map((a: any) => (typeof a === 'object' ? JSON.stringify(a) : a))}</p>`;
        }
    }
    console.log(args);

    return args.join(' ');
};

export const debug = (...args: any) => log('debug', ...args);
export const info = (...args: any) => log('info', ...args);
export const error = (...args: any) => log('error', ...args);
export const success = (...args: any) => log('success', ...args);

export const sharedTest = async (description: string, callback: () => any) => {
    const timeout = 5000;
    try {
        info(`🔍 ${description}`);
        await Promise.race([
            callback(),
            new Promise((_, reject) =>
                setTimeout(() => reject(`Timeout after ${timeout}`), timeout),
            ),
        ]);
        success(description);
    } catch (e) {
        throw new Error(error(e));
    }
};
