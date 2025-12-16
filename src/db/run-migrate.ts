import { migrate } from '.';
import './models/guildOptions.model';
import './models/userMetric.model';
import './models/analysisResult.model';

async function main() {
    await migrate();
}

main();