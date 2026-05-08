import { r2, BUCKET } from "./r2.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export default async function uploadToR2(buffer, fileName, mimeType) {
    await r2.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: fileName,
            Body: buffer,
            ContentType: mimeType
        })
    );

    //return `${process.env.R2_ENDPOINT}/${BUCKET}/${fileName}`;
    return `${process.env.R2_PUBLIC_URL}/${fileName}`;
}