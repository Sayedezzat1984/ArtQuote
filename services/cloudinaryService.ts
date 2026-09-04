// Powered by OnSpace.AI
// Centralized Cloudinary media service for SayedEzzat app
// Uses unsigned upload preset — NO API Secret required

const CLOUD_NAME = 'xmw6ezej';
const UPLOAD_PRESET = 'sayed_ezzat_app';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload a single image URI (local file path or remote URL) to Cloudinary.
 * Returns secure_url and public_id for Firestore storage.
 */
export async function uploadImageToCloudinary(
  localUri: string,
  folder: string = 'sayed_ezzat',
  onProgress?: (progress: UploadProgress) => void,
): Promise<CloudinaryUploadResult> {
  // Build multipart form data
  const formData = new FormData();

  // Derive filename and mime type from URI
  const uriParts = localUri.split('.');
  const ext = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp',
    gif: 'image/gif', heic: 'image/heic',
  };
  const mimeType = mimeMap[ext] || 'image/jpeg';
  const fileName = `artwork_${Date.now()}.${ext}`;

  // React Native FormData accepts { uri, name, type } for file fields
  formData.append('file', { uri: localUri, name: fileName, type: mimeType } as any);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  // Use XMLHttpRequest for upload progress support
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as CloudinaryUploadResult;
          resolve(response);
        } catch {
          reject(new Error('فشل في قراءة استجابة Cloudinary'));
        }
      } else {
        let errMsg = 'فشل رفع الصورة';
        try {
          const errData = JSON.parse(xhr.responseText);
          errMsg = errData?.error?.message || errMsg;
        } catch {}
        reject(new Error(`${errMsg} (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('خطأ في الاتصال بـ Cloudinary'));
    xhr.ontimeout = () => reject(new Error('انتهت مهلة الرفع'));
    xhr.timeout = 120_000; // 2 minutes timeout

    xhr.open('POST', UPLOAD_URL);
    xhr.send(formData);
  });
}

/**
 * Upload multiple images sequentially with per-item progress callbacks.
 * Returns array of results (null if individual upload failed).
 */
export async function uploadMultipleImages(
  localUris: string[],
  folder: string = 'sayed_ezzat',
  onItemProgress?: (index: number, progress: UploadProgress) => void,
  onItemDone?: (index: number, result: CloudinaryUploadResult | null) => void,
): Promise<(CloudinaryUploadResult | null)[]> {
  const results: (CloudinaryUploadResult | null)[] = [];

  for (let i = 0; i < localUris.length; i++) {
    const uri = localUris[i];

    // Skip already-uploaded Cloudinary URLs (contain cloudinary.com)
    if (isCloudinaryUrl(uri)) {
      results.push(null); // Already uploaded, caller should keep existing data
      onItemDone?.(i, null);
      continue;
    }

    try {
      const result = await uploadImageToCloudinary(
        uri,
        folder,
        (progress) => onItemProgress?.(i, progress),
      );
      results.push(result);
      onItemDone?.(i, result);
    } catch (err) {
      results.push(null);
      onItemDone?.(i, null);
    }
  }

  return results;
}

/**
 * Check if a URI is already a Cloudinary URL (already uploaded).
 */
export function isCloudinaryUrl(uri: string): boolean {
  return uri.includes('cloudinary.com') || uri.includes('res.cloudinary.com');
}

/**
 * Check if a URI is a local device file (needs upload).
 */
export function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('/') || uri.startsWith('content://');
}

/**
 * Build an optimized Cloudinary delivery URL from a stored URL.
 * Preserves the original if transformation fails.
 */
export function buildOptimizedUrl(
  secureUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg';
    crop?: 'fill' | 'fit' | 'scale' | 'pad';
  } = {},
): string {
  if (!secureUrl || !isCloudinaryUrl(secureUrl)) return secureUrl;

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fit',
  } = options;

  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push(`c_${crop}`);
  transforms.push(`q_${quality}`);
  transforms.push(`f_${format}`);

  const transformString = transforms.join(',');

  // Insert transformation after /upload/
  return secureUrl.replace('/upload/', `/upload/${transformString}/`);
}

/**
 * Get a thumbnail URL (200x200) for list/grid displays.
 */
export function getThumbnailUrl(secureUrl: string): string {
  return buildOptimizedUrl(secureUrl, {
    width: 400,
    height: 400,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Get an optimized URL for full-screen display.
 */
export function getFullDisplayUrl(secureUrl: string): string {
  return buildOptimizedUrl(secureUrl, {
    width: 1200,
    quality: 'auto',
    format: 'auto',
    crop: 'fit',
  });
}

/**
 * Merge local images with already-uploaded ones.
 * local image URIs = need upload, cloudinary URLs = keep as-is.
 */
export function separateLocalAndCloud(
  uris: string[],
): { localIndexes: number[]; cloudIndexes: number[] } {
  const localIndexes: number[] = [];
  const cloudIndexes: number[] = [];

  uris.forEach((uri, i) => {
    if (isCloudinaryUrl(uri)) {
      cloudIndexes.push(i);
    } else {
      localIndexes.push(i);
    }
  });

  return { localIndexes, cloudIndexes };
}
