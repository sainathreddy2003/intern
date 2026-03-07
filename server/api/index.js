const app = require('../src/app');
const { connectDB } = require('../src/config/db');

let dbReadyPromise = null;

const ensureDbReady = async () => {
  if (!dbReadyPromise) {
    dbReadyPromise = connectDB().catch((error) => {
      dbReadyPromise = null;
      throw error;
    });
  }
  await dbReadyPromise;
};

module.exports = async (req, res) => {
  await ensureDbReady();
  return app(req, res);
};
