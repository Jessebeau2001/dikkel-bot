import { migrate } from '.';
import './models/guildOptions.model';
import './models/userMetric.model';

async function main() {

    await migrate();
}

main();