import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export async function uploadImage(
  buffer: Buffer,
  folder = 'wall4art',
): Promise<{ url: string; publicId: string }> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    if (buffer.length > 1.5 * 1024 * 1024) {
      throw new Error(
        'Image trop lourde sans Cloudinary (max 1,5 Mo). Réduisez la taille ou configurez CLOUDINARY_*.',
      );
    }
    const base64 = buffer.toString('base64');
    const mime = 'image/jpeg';
    const url = `data:${mime};base64,${base64}`;
    return { url, publicId: 'local-dev' };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Upload failed'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}
