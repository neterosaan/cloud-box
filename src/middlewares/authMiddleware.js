import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import prisma from "../config/prisma.js";

const client = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  
});
function getKey(header, callback) {
  console.log("KID:", header.kid);

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.log("JWKS ERROR:", err.message);
      return callback(err);
    }

    const publicKey = key.getPublicKey();
    callback(null, publicKey);
  });
}

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: no token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, getKey, {}, async (err, decodedToken) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: invalid token",
      });
    }

    try {
      const supabaseUserId = decodedToken.sub;
      console.log(supabaseUserId)

      const user = await prisma.user.upsert({
        where: { supabaseId: supabaseUserId },
        update: {},
        create: {
          supabaseId: supabaseUserId,
          email: decodedToken.email ?? null,
        },
      });

      req.user = user;
      next();
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }
  });
};