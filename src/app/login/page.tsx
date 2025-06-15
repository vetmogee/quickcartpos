"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Image from "next/image"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Registrace úspěšná! Nyní se můžete přihlásit.")
      // Clean the URL query parameter
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setLoading(true)

    if (!email || !password) {
      setError("Zadejte prosím email i heslo.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Přihlášení se nezdařilo.")
      }

      // Login successful, token is set as an httpOnly cookie by the server.
      // Redirect to the POS page.
      console.log("Login successful, redirecting...")
      router.push("/pos") // Redirect to your main POS page

    } catch (err) {
      setError(err instanceof Error ? err.message : "Přihlášení se nezdařilo.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-300 relative">
      <div className="absolute top-5 left-5 flex items-center gap-2 z-20">
        <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => router.push("/")}
              disabled={loading}
            >
                      <Image
          src="/quickcartposlogonobg.png"
          alt="QuickCart POS Logo"
          width={40}
          height={40}
          className="opacity-100"
        />
        <span className="text-xl font-bold text-gray-800">QuickCartPOS</span>
            </Button>

      </div>
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <form className="space-y-6 max-w-md w-full p-8 bg-white shadow-md rounded-lg relative z-10" onSubmit={handleLogin}>
          <h2 className="text-2xl font-bold text-center">Přihlášení</h2>
          {successMessage && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-lg h-12 mt-1"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-lg h-12 mt-1"
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full h-14 text-xl mt-4" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : "Přihlásit se"}
          </Button>
        
          <div className="text-center mt-0">
            <span className="text-gray-600">Jste tu nový? </span>
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-800 p-0"
              onClick={() => router.push('/register')}> Registrovat </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
} 