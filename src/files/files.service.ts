import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { S3 } from 'aws-sdk';
import { extension } from "mime-types"
@Injectable()
export class FilesService {
  constructor() { }

  async uploadPublicFile(file: any, merchant_uid) {
    if (!file)
      return { Key: null, Location: null }
    const s3 = new S3();

    const extention = extension(file.mimetype)

    const uploadResult = await s3.upload({
      Bucket: process.env.S3_PUBLIC_BUCKET_NAME,
      Body: file.buffer,
      ACL: "public-read",
      Key: `merchants/${merchant_uid}/${uuid()}.${extention}`
    })
      .promise();
    return uploadResult; // {Key,Location}
  }


  async deletePublicFile(key) {
    const s3 = new S3();
    await s3.deleteObject({
      Bucket: process.env.S3_PUBLIC_BUCKET_NAME,
      Key: key,
    }).promise();
  }
}
