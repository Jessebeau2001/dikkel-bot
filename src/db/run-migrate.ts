import sequelize, { migrate } from '.';
import './models/guildOptions.model';
import './models/userMetric.model';
import './models/analysisResult.model';

async function main() {
    await migrate();
    if (sequelize.getDialect() === 'sqlite') {
        await sequelize.query('PRAGMA journal_mode = WAL;');
    }
}

main();