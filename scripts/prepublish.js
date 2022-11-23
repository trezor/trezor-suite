if (!process.env.CI) {
    console.log('DO NOT TRY TO PUBLISH FROM YOUR LOCAL MACHINE! Publish only from CI.');
    process.exit(1);
}
