import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Image
              src="/quickcartposlogonobg.png"
              alt="QuickCart POS Logo"
              width={50}
              height={50}
              className="object-contain mt-2"
            />
            <h1 className="text-5xl font-bold text-gray-900">
              QuickCartPOS
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-12">
            Modern point of sale system for your business. Manage products, track sales, and grow your business with ease.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Register
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Easy Management</h3>
              <p className="text-gray-600">Manage your products with an intuitive interface.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Sales Tracking</h3>
              <p className="text-gray-600">Track your sales and generate detailed reports.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Fast Checkout</h3>
              <p className="text-gray-600">Quick and efficient checkout process for your customers.</p>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">New technologies</h3>
              <p className="text-gray-600">Build with Next.js, TypeScript, and Tailwind CSS.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Modern design</h3>
              <p className="text-gray-600">Built with Tailwind CSS for a modern and clean user experience.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Fast connectivity</h3>
              <p className="text-gray-600">Boot your POS quickly and anywhere with Supabase.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
