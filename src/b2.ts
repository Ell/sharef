import { sha1 } from "./util";

declare var B2_API_ID: string;
declare var B2_API_SECRET: string;
declare var B2_BUCKET_ID: string;

async function getB2Authorization(): Promise<{ token: string; url: string }> {
  const request = await fetch(
    "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${B2_API_ID}:${B2_API_SECRET}`)}`,
      },
    }
  );

  const response = await request.json();

  return { token: response.authorizationToken, url: response.apiUrl };
}

async function getB2UploadUrl(): Promise<{ url: string; token: string }> {
  const { token, url } = await getB2Authorization();

  const request = await fetch(`${url}/b2api/v2/b2_get_upload_url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ bucketId: B2_BUCKET_ID }),
  });

  const response = await request.json();

  return { url: response.uploadUrl, token: response.authorizationToken };
}

export async function uploadFile(
  fileName: string,
  data: ArrayBuffer
): Promise<{
  fileName: string;
  contentType: string;
  sha1: string;
  size: number;
}> {
  const { url, token } = await getB2UploadUrl();

  const hashHex = await sha1(data);

  const request = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "X-Bz-File-Name": fileName,
      "Content-Type": "b2/x-auto",
      "Content-Length": `${data.byteLength}`,
      "X-Bz-Content-Sha1": hashHex,
    },
    body: data,
  });

  const response = await request.json();

  return {
    fileName: response.fileName,
    contentType: response.contentType,
    sha1: hashHex,
    size: data.byteLength,
  };
}
