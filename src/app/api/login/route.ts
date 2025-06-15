import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "YOUR_VERY_SECRET_JWT_KEY_CHANGE_THIS";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email i heslo jsou povinné." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Neplatný email nebo heslo." }, { status: 401 });
    }

    if (!user.passwordHash) {
      // Should not happen if registration is done correctly
      console.error(`User ${email} has no passwordHash.`);
      return NextResponse.json({ error: "Interní chyba serveru." }, { status: 500 });
    }

    const isPasswordValid = await compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Neplatný email nebo heslo." }, { status: 401 });
    }

    // Password is valid, generate JWT
    const tokenPayload = {
      userId: user.id.toString(),
      email: user.email,
      // Add any other non-sensitive info you might need in the token
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "12h" }); // Token expires in 1 hour

    const userForJson = {
      id: user.id.toString(),
      ico: user.ico,
      fname: user.fname,
      sname: user.sname,
      email: user.email,
    };
    
    // Create a response and set the JWT as an httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: "Přihlášení úspěšné!",
      user: userForJson,
      // token: token, // Optionally send token in body if not using cookies for storage initially
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development", // Use secure cookies in production
      sameSite: "strict",
      maxAge: 12 * 60 * 60, // 12 hours in seconds
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Přihlášení se nezdařilo." }, { status: 500 });
  }
} 