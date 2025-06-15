import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ico = searchParams.get("ico")
  if (!ico || !/^\d{8}$/.test(ico)) {
    return NextResponse.json({ error: "Invalid IČO" }, { status: 400 })
  }
  try {
    const aresRes = await fetch(
      `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`
    )

    const data = await aresRes.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }
} 