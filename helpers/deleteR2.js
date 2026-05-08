import { r2, BUCKET } from "./r2.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export default async function deleteFromR2(url) {
    const key = url.split("/").pop();

    await r2.send(
        new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key
        })
    );
}