require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { ensureOrganizationStructure } = require('./seed/organizationStructure');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await ensureOrganizationStructure();
  app.listen(PORT, () => {
    console.log(`Wolkite University Events API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});
