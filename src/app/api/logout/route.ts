import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });

    // Clear the token cookie by setting its attributes on the response
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0), // Set expiry to a past date
      path: '/', 
      sameSite: 'lax',
    });
    // Or alternatively, using delete:
    // response.cookies.delete('token'); 
    // Using .set with an empty value and past expiry is more explicit for all browsers

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 