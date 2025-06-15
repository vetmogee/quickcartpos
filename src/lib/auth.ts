// Import required dependencies for JWT verification and Next.js server components
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWTPayload } from 'jose';

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to get secret key bytes (required by jose)
async function getSecretKey(): Promise<Uint8Array> {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(JWT_SECRET);
}

// Interface defining the structure of user data in JWT payload
interface UserPayload extends JWTPayload {
  userId: string; // Or number, depending on what you store (ensure consistency)
  email: string;
  // Add other expected properties from your token payload
}

// Interface defining the structure of authentication verification result
interface VerificationResult {
  user: UserPayload | null;
  error?: string;
  response?: NextResponse; // Optional: Include response for clearing cookies on error
}

/**
 * Verifies the JWT token from the request cookies.
 * Returns the decoded user payload or null if verification fails.
 */
export async function verifyAuth(request: NextRequest): Promise<VerificationResult> {
  // Extract token from cookies
  const tokenCookie = request.cookies.get('token');
  const token = tokenCookie?.value;

  // Return error if no token is found
  if (!token) {
    return { user: null, error: 'Missing authentication token' };
  }

  try {
    // Verify the JWT token using the secret key
    const secretKey = await getSecretKey();
    const { payload } = await jwtVerify<UserPayload>(token, secretKey);
    // Ensure the payload contains expected user fields
    if (!payload.userId || !payload.email) {
        throw new Error('Invalid token payload structure');
    }
    return { user: payload };
  } catch (error) {
    console.error('JWT Verification Error:', error);
    // Clear the invalid/expired token
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'session_expired');
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set({
      name: 'token',
      value: '',
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Check error code if it's an Error instance with a code property
    let errorCode: string | undefined;
    if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
      errorCode = error.code;
    }

    // Handle different types of JWT verification errors
    if (errorCode === 'ERR_JWT_EXPIRED') {
      return { user: null, error: 'Session expired. Please log in again.', response };
    } else if (errorCode === 'ERR_JWS_INVALID' || errorCode === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      return { user: null, error: 'Invalid token.', response };
    } else {
      // Construct error message including details if possible
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed.';
      return { user: null, error: errorMessage, response }; 
    }
  }
} 