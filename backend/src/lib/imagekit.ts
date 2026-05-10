import ImageKit from "@imagekit/nodejs";
import { ENV } from "./env";
import { NotFoundError } from "@imagekit/nodejs";


export const deleteImageKitAsset = async (env: ENV, storedFileId: string | null) => {
    if(!storedFileId) return;
    const client = new ImageKit({ privateKey: env.IMAGEKIT_PRIVATE_KEY });
    try {
        await client.files.delete(storedFileId);
    }catch(e: unknown) {
        if(e instanceof NotFoundError) return;
        throw e;
    }
}