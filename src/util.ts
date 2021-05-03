export async function sha1(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", data);
  const digestArray = Array.from(new Uint8Array(digest));

  return digestArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
