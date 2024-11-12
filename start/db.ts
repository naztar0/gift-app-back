import { connectToDatabase } from '#services/database';

connectToDatabase().catch(console.error);
