import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import prisma from "../config/prisma.js";

const client = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000,
      rateLimit: true,
});
function getKey(header, callback) {

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error("JWKS ERROR:", err.message);
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


  jwt.verify(token, getKey, {algorithms: ["ES256"]}, async (err, decodedToken) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: invalid token",
      });
    }

    try {
      const supabaseUserId = decodedToken.sub;

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
      console.error("DB error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }
  });
};