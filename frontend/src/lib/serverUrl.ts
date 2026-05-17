export const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8000"
    : "https://backend-dot-madrigal-online.appspot.com";

const BUCKET = "madrigal-online.appspot.com";
const STORAGE_BASE = "https://storage.googleapis.com";

export function storageUrl(path: string) {
  return `${STORAGE_BASE}/${BUCKET}/${path}`;
}

export function cardImageUrl(color: string, normalizedName: string) {
  return storageUrl(`card_images/${normalizedName}-${color}.jpg`);
}

export function soundUrl(normalizedName: string) {
  return storageUrl(`sounds/${normalizedName}.mp3`);
}
