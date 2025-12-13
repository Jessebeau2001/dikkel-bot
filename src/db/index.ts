import { Sequelize } from 'sequelize';

const DB_STORAGE = 'db/database.sqlite';

export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: DB_STORAGE,
    logging: false
});

// This is ass, use migrations, see: https://sequelize.org/docs/v6/core-concepts/model-basics/#synchronization-in-production
export async function migrate() {
    process.stdout.write('Migrating db...');
    const query = sequelize.getQueryInterface();
    const initial = new Set(await query.showAllTables());

    // Synchronize
    await sequelize.sync({ alter: true });
    // await sequelize.sync();

    const after = new Set(await query.showAllTables());
    process.stdout.write(' [done]\n');
    return after.difference(initial);
}

export default sequelize;