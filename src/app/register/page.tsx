"use client"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function RegisterPage() {
  const [searchInput, setSearchInput] = useState("");
  const [selectedIco, setSelectedIco] = useState<string | null>(null);
  const [company, setCompany] = useState({ name: "", address: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [aresOptions, setAresOptions] = useState<ComboboxOption[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Debounced search effect for IČO
  useEffect(() => {
    if (searchInput.length < 3) {
      setAresOptions([]);
      setLoading(false);
      return;
    }
    // Basic check if it looks like an IČO or part of it for search
    // The API will decide how to search (by IČO or name part)
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/ares-search?query=${searchInput}`);
      const data = await res.json();
      setAresOptions((data.results || []).map((c: { ico: string; name: string }) => ({ value: c.ico, label: `${c.ico} – ${c.name}` })));
      setLoading(false);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  async function handleIcoSelect(option: ComboboxOption) {
    setSelectedIco(option.value); // ulozeni ico
    setSearchInput(option.value); // nastaveni ico jako input pro vyhledavani
    setAresOptions([]); 
    setLoading(true);
    try {
      const res = await fetch(`/api/ares?ico=${option.value}`); // vyhledani v ares api
      if (!res.ok) throw new Error("Nepodařilo se načíst údaje o firmě."); // chytani erroru
      const data = await res.json();
      setCompany({
        name: data.obchodniJmeno || "",
        address: data.sidlo?.textovaAdresa || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při načítání firmy.");
      setCompany({ name: "", address: "" }); 
    }
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // ICO validation
    if (!selectedIco) {
      setError("Vyberte prosím firmu podle IČO.");
      return;
    }

    // Email validation
    if (!email) {
      setError("Zadejte prosím emailovou adresu.");
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      setError("Zadejte prosím platnou emailovou adresu.");
      return;
    }

    // Password validation
    if (!password) {
      setError("Zadejte prosím heslo.");
      return;
    }
    if (password.length < 8) {
      setError("Heslo musí mít alespoň 8 znaků.");
      return;
    }
    if (password !== confirm) {
      setError("Hesla se neshodují.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ico: selectedIco,
          companyName: company.name,
          companyAddress: company.address,
          email,
          password,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Registrace se nezdařila.");
      }
      
      console.log("Registration successful:", result);
      // Redirect to login page with a success indicator
      router.push("/login?registered=true");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrace se nezdařila.");
    }
    setLoading(false);
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
        <form className="space-y-6 max-w-md w-full p-8 bg-white shadow-md rounded-lg relative z-10" onSubmit={handleRegister}>
        <h2 className="text-2xl font-bold text-center">Registrace</h2>
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="ico">IČO</Label>
            <Combobox
              inputValue={searchInput} // What user types, or selected IČO
              onInputChange={setSearchInput} // Updates searchInput as user types
              options={aresOptions} // Suggestions from ARES
              onOptionSelect={handleIcoSelect} // Handles when user picks a company
              placeholder="Zadejte IČO firmy"
              loading={loading}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <Label>Firma</Label>
            <Input value={company.name} readOnly className="bg-gray-100 text-lg h-12" />
          </div>
          <div>
            <Label>Adresa</Label>
            <Input value={company.address} readOnly className="bg-gray-100 text-lg h-12" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={e => setEmail(e.target.value)} className="text-lg h-12" required />
          </div>
          <div>
            <Label htmlFor="password">Heslo</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="text-lg h-12" required />
          </div>
          <div>
            <Label htmlFor="confirm">Potvrdit heslo</Label>
            <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="text-lg h-12" required />
          </div>
          <Button type="submit" className="w-full h-14 text-xl mt-4  " disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : "Registrovat"}
          </Button>
          <div className="text-center mt-0">
            <span className="text-gray-600">Už jste registrovaný? </span>
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-800 p-0"
              onClick={() => router.push('/login')}> Přihlásit </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 