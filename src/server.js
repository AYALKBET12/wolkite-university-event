require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Wolkite University Events API listening on port ${PORT}`);
  });
}

start();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});
