import { uploadFile } from "./b2";
import { customAlphabet } from "nanoid";

declare var API_KEY: string;
declare var CF_ACCOUNT_ID: string;
declare var CF_ACCOUNT_TOKEN: string;
declare var WEBHOOK_SECRET: string;
declare var UPLOADER: any;

const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 8);

export async function handleUploadHook(request: Request) {
  const sig_header = request.headers.get("Webhook-Signature");

  if (!sig_header) {
    return new Response("invalid or missing Webhook-Signature header", {
      status: 400,
    });
  }

  const split = sig_header.split("=");
  const body = await request.text();

  const key = WEBHOOK_SECRET;
  const message = `${split[1].split(",")[0]}.${body}`;

  const getUtf8Bytes = (str: string) =>
    new Uint8Array(
      [...unescape(encodeURIComponent(str))].map((c) => c.charCodeAt(0))
    );

  const keyBytes = getUtf8Bytes(key);
  const messageBytes = getUtf8Bytes(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", cryptoKey, messageBytes);

  const hmac = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const request_sha = split[2];

  if (request_sha !== hmac) {
    return new Response("invalid or missing Webhook-Signature header", {
      status: 400,
    });
  }

  const parsed = JSON.parse(body);

  if (parsed.readyToStream) {
    const data = await UPLOADER.get("file:" + parsed.meta.name);
    const parsed_data = JSON.parse(data);

    await UPLOADER.put(
      "file:" + parsed.meta.name,
      JSON.stringify({
        ...parsed_data,
        uid: parsed.uid,
      })
    );
  }

  return;
}

export async function handleUpload(request: any) {
  if (request.headers.get("X-Api-Key") !== API_KEY) {
    return new Response("invalid or missing Api-Key header", { status: 400 });
  }

  if (!request.headers.get("X-Filename")) {
    return new Response("invalid or missing X-Filename header", {
      status: 400,
    });
  }

  const originalName = request.headers.get("X-Filename");
  const extension = originalName.split(".").pop();
  const fileId = nanoid();
  const fileName = `${fileId}.${extension}`;

  const data = await request.arrayBuffer();
  const response = await uploadFile(fileName, data);
  const url = `https://i.ell.dev/${fileName}`;

  const fileInfo = {
    ...response,
    id: fileId,
    originalName,
    url,
    uid: null,
    fileName,
  };

  await UPLOADER.put("file:" + fileName, JSON.stringify(fileInfo));

  if (["mp4", "mkv", "webm"].includes(extension)) {
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/copy`,
      {
        method: "POST",
        body: JSON.stringify({
          url: `https://f001.backblazeb2.com/file/ell-dev/${fileName}`,
          meta: {
            name: fileName,
          },
        }),
        headers: {
          Authorization: `Bearer ${CF_ACCOUNT_TOKEN}`,
        },
      }
    );
  }

  return new Response(JSON.stringify(fileInfo), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
