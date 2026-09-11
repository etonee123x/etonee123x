import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const infrastructureDirectory = path.resolve(backendDirectory, '..', '..', 'infra');

process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = 'test-secret';
process.env.AUTH_TOKEN_MAX_LIFETIME_MINUTES = '10';
process.env.DATABASE_PATH = path.resolve(infrastructureDirectory, 'database');
process.env.CONTENT_PATH = path.resolve(infrastructureDirectory, 'content');
process.env.UPLOADS_PATH = path.resolve(infrastructureDirectory, 'uploads');
process.env.AUDIO_COVERS_PATH = path.resolve(infrastructureDirectory, 'covers');
process.env.FILE_INSPECTOR_CACHE_PATH = path.resolve(infrastructureDirectory, 'caches', 'file-inspector');
process.env.JSON_BODY_LIMIT = '1mb';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.PORT = '0';
process.env.REQUEST_TIMEOUT_MS = '30000';
process.env.HEADERS_TIMEOUT_MS = '10000';
process.env.KEEP_ALIVE_TIMEOUT_MS = '5000';
