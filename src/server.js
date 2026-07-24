import 'dotenv/config';
import { validateEnv } from './config/validateEnv.js';
validateEnv();
import app from './app.js';
import { runUploadCleanupJob } from './lib/uploadCleanupJob.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
logger.info(`🚀 Server is flying on http://localhost:${PORT}`);
});

runUploadCleanupJob();
setInterval(runUploadCleanupJob, 15 * 60 * 1000);