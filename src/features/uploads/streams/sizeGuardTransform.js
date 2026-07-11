import { Transform } from 'stream';

export class SizeGuardTransform extends Transform {
  constructor({ maxBytes }) {
    super();
    this.maxBytes = maxBytes;
    this.bytesReceived = 0;
  }

  _transform(chunk, encoding, callback) {
    this.bytesReceived += chunk.length;

    if (this.bytesReceived > this.maxBytes) {
      const err = new Error(
        `File exceeds the maximum allowed size of ${this.maxBytes} bytes.`
      );
      err.status = 413;
      return callback(err); 
    }

    this.push(chunk);
    callback();
  }
}