import jwt from 'jsonwebtoken';

export const generateToken = (id: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'supersecretkeypos12345';
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';

  return jwt.sign({ id, role }, secret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn']
  });
};
