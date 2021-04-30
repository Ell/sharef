import { Request } from 'itty-router';

export async function handleUpload(request: Request) {
    console.log(request);

    return new Response('uploader inc', { status: 404 });
}
