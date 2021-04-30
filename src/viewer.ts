const b2Domain = 'i.ell.dev';
const b2Bucket = 'ell-dev';
const b2UrlPath = `/file/${b2Bucket}/`;
const redirectUrl = 'https://i.ell.dev/1566217245384.webm';


const corsFileTypes = [
    'png',
    'jpg',
    'gif',
    'jpeg',
    'webp',
    'webm',
    'mp3',
    'mp4',
];

const removeHeaders = [
    'x-bz-content-sha1',
    'x-bz-file-id',
    'x-bz-file-name',
    'x-bz-info-src_last_modified_millis',
    'X-Bz-Upload-Timestamp'
];

export async function serveFile(request: any) {
    const url = new URL(request.url);

    if(url.host === b2Domain && !url.pathname.startsWith(b2UrlPath)) {
	      url.pathname = b2UrlPath + url.pathname;
	  }

	  const response = await fetch(url.toString());

    const { status, statusText } = response;

    if (status !== 200 || !url.pathname) {
        return Response.redirect(redirectUrl);
    }

    const newHdrs = new Headers(response.headers);

    if(url.pathname && corsFileTypes.includes(url.pathname.split('.').pop()!)) {
		    newHdrs.set('Access-Control-Allow-Origin', '*');
	  }

	  removeHeaders.forEach((header) => {
		    newHdrs.delete(header);
	  });

	  return new Response(response.body, {
		    status,
		    statusText,
		    headers: newHdrs
	  });
}
