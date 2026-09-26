import 'dotenv/config';
import { OneTimeTokenModule } from '@/modules/one-time-token/one-time-token.module';

const url = new URL('/en/blog', 'http://localhost:3000');
const ott = await new OneTimeTokenModule().oneTimeTokenService.create();

url.searchParams.set('ott', ott);

// eslint-disable-next-line no-console
console.log(url.href);
