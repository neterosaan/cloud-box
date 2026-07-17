import { Transform } from 'stream';

export class SizeGuardTransform extends Transform {
  constructor({ maxBytes, currentUsage, storageQuota }) {
    super();
    this.maxBytes = maxBytes;
    this.currentUsage = currentUsage;
    this.storageQuota = storageQuota; 
    this.bytesReceived = 0;
  }

  _transform(chunk, encoding, callback) {
    this.bytesReceived += chunk.length;

    const totalUsage = this.currentUsage + this.bytesReceived;

    if (this.bytesReceived > this.maxBytes) {
      const err = new Error(
        `File exceeds the maximum allowed size of ${this.maxBytes} bytes.`
      );
      err.status = 413;
      return callback(err); 
    }

    if (totalUsage > this.storageQuota) {
      const usedGB = (totalUsage / (1024 ** 3)).toFixed(2);
      const quotaGB = (this.storageQuota / (1024 ** 3)).toFixed(2);

      const err = new Error(
        `Storage quota exceeded. You are using ${usedGB}GB of your ${quotaGB}GB limit.`
      );
      err.status = 507;
      return callback(err);
    }
    this.push(chunk);
    callback();
  }
}