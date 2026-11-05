import 'dotenv/config';
import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`ServiceFlow API listening on port ${env.port}`);
});
