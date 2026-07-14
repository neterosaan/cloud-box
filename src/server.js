import 'dotenv/config';
import app from './app.js';
import { runUploadCleanupJob } from './lib/uploadCleanupJob.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server is flying on http://localhost:${PORT}`);
});

runUploadCleanupJob();
setInterval(runUploadCleanupJob, 15 * 60 * 1000);