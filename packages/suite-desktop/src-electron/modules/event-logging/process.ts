const init = () => {
    const { logger } = global;

    process.on('uncaughtException', e => {
        logger.error('exception', e.message);
    });

    process.on('unhandledRejection', e => {
        if (e) {
            logger.warn('rejection', `Unhandled Rejection: ${e.toString()}`);
        }
    });
};

export default init;
