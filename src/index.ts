import { Router } from 'itty-router';

import { serveFile } from './viewer';
import { handleUpload } from './uploader';


const router = Router();

router.get('/:file', (request) => serveFile(request));
router.post('/upload', (request) => handleUpload(request));

self.addEventListener('fetch', (event: FetchEvent) => {
    event.respondWith(router.handle(event.request));
});

