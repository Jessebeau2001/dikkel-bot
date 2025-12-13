// src/run-deploy.ts

import { deployAllAppCommands } from './commands';

async function main() {
    await deployAllAppCommands();
}

main();