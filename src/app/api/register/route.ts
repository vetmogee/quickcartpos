import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { ico, companyName, companyAddress, email, password } = await req.json()
    if (!ico || !email || !password) {
      return NextResponse.json({ error: "Chybí pole" }, { status: 400 })
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email již je registrovaný" }, { status: 409 })
    }
    const passwordHash = await hash(password, 10)
    const user = await prisma.user.create({
      data: {
        ico: parseInt(ico, 10),
        fname: companyName,
        sname: companyAddress,
        email,
        passwordHash,
      },
    })
    const userForJson = {
      id: user.id.toString(),
      ico: user.ico,
      fname: user.fname,
      sname: user.sname,
      email: user.email,
    }
    return NextResponse.json({ success: true, user: userForJson })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Registrace se nezdařila" }, { status: 500 })
  }
} 