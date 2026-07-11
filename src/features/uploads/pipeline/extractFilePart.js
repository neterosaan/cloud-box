import Busboy from 'busboy';


export const extractFilePart = (req) => {
  return new Promise((resolve, reject) => {
    let fileFound = false;

    const busboy = Busboy({ headers: req.headers });

    busboy.on('file', (fieldname, fileStream, info) => {
      fileFound = true;

      fileStream.on('error', (err) => {
        err.status = 400;
        reject(err);
      });

      resolve({ fileStream, info });
    });

    busboy.on('finish', () => {
      if (!fileFound) {
        const err = new Error('No file field found in the multipart request. Make sure the field name is "file".');
        err.status = 400;
        reject(err);
      }
    });

    busboy.on('error', (err) => {
      err.status = 400;
      reject(err);
    });

    req.pipe(busboy);
  });
};