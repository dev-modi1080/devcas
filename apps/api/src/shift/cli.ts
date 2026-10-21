/**
 * Shift CLI — manages the local SQLite database.
 *
 *   npm run shift:setup --workspace=@cas/api   # create the schema
 *   npm run shift:seed   --workspace=@cas/api   # create the schema + demo data
 *   npm run shift:reset  --workspace=@cas/api   # wipe, recreate and seed
 */
import { ShiftService } from './shift.service';
import { seed } from './seed';

async function main() {
  const command = (process.argv[2] || 'seed').toLowerCase();
  const shift = new ShiftService();

  console.log(`Shift database: ${shift.databaseFile}`);

  switch (command) {
    case 'setup':
    case 'migrate':
      shift.ensureSchema();
      console.log('Schema created successfully!');
      break;
    case 'seed':
      await seed(shift);
      break;
    case 'reset':
      shift.resetSchema();
      console.log('Existing data removed.');
      await seed(shift);
      break;
    default:
      console.error(`Unknown command "${command}". Use one of: setup, seed, reset.`);
      process.exitCode = 1;
  }

  await shift.onModuleDestroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
