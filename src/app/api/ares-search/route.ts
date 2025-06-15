//C:\quickcartpos1\src\app\api\ares-search\route.ts
import { NextRequest, NextResponse } from "next/server"

interface AresCompany {
  ico?: string[]
  obchodniJmeno?: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query")
  if (!query || query.length < 3) {
    return NextResponse.json({ results: [] }, { status: 400 })
  }

  const body: AresCompany = {}
  if (/^\d+$/.test(query)) {
    body.ico = [query]
  } else {
    body.obchodniJmeno = query
  }

  try {
    const aresRes = await fetch(
      "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    ).catch(e => {
      console.error(e)
      return NextResponse.json({ results: [] }, { status: 500 })
    })
    const data = await aresRes.json()
    const results = (data.ekonomickeSubjekty || []).map((c: AresCompany) => ({
      ico: c.ico,
      name: c.obchodniJmeno,
    }))
    return NextResponse.json({ results })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
} 