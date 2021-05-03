declare var CF_ACCOUNT_ID: string;
declare var CF_ACCOUNT_TOKEN: string;
declare var UPLOADER: any;

const b2Domain = "i.ell.dev";
const b2Bucket = "ell-dev";
const b2UrlPath = `/file/${b2Bucket}/`;
const redirectUrl = "https://i.ell.dev/1566217245384.webm";

const corsFileTypes = [
  "png",
  "jpg",
  "gif",
  "jpeg",
  "webp",
  "webm",
  "mp3",
  "mp4",
];

const removeHeaders = [
  "x-bz-content-sha1",
  "x-bz-file-id",
  "x-bz-file-name",
  "x-bz-info-src_last_modified_millis",
  "X-Bz-Upload-Timestamp",
];

export async function serveFile(request: any) {
  const url = new URL(request.url);

  if (url.host === b2Domain && !url.pathname.startsWith(b2UrlPath)) {
    url.pathname = b2UrlPath + url.pathname;
  }

  const response = await fetch(url.toString());

  const { status, statusText } = response;

  if (status !== 200 || !url.pathname) {
    return Response.redirect(redirectUrl);
  }

  const newHdrs = new Headers(response.headers);

  const ext = url.pathname.split(".").pop()!;

  if (["mp4", "webm", "mkv"].includes(ext)) {
    const entry = await UPLOADER.get("file:" + url.pathname.split("/").pop()!);
    const parsed_entry = JSON.parse(entry);

    if (parsed_entry.uid) {
      return renderVideoPlayer(parsed_entry);
    }
  }

  if (corsFileTypes.includes(ext)) {
    newHdrs.set("Access-Control-Allow-Origin", "*");
  }

  removeHeaders.forEach((header) => {
    newHdrs.delete(header);
  });

  return new Response(response.body, {
    status,
    statusText,
    headers: newHdrs,
  });
}

function renderVideoPlayer(info: any): Response {
  const response = `
    <!doctype html>
    <head>
      <link rel="icon" href="data:,">
      <title>chill.cat -- ${info.originalName}</title>
    </head>
    <body style="background-color: #111; overflow: hidden;">
      <div style="padding: 50px; margin: 0 auto; max-width: 1280px; max-height: 720px;">
        <div style="position: relative; padding-top: 56.25%;">
          <iframe
            src="https://iframe.videodelivery.net/${info.uid}?muted=true&autoplay=false&loop=false"
            style="border: none; position: absolute; top: 0; height: 100%; width: 100%;"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowfullscreen="true"
          ></iframe>
        </div>
      </div>
    </body>
  `;

  return new Response(response, {
    status: 200,
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}
