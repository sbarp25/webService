import Link from "next/link"
import { Scissors, Sticker, UserSquare, LayoutGrid, Layout, RefreshCw } from "lucide-react"

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "name": "Photo Studio",
        "url": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "description": "Free online photo editing tools including sticker maker, circle cropper, QR code generator, passport photo maker, watermark tool, collage maker, and image converter",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Any",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "featureList": [
          "Sticker Creator with borders and print sheets",
          "Circle Image Cropper",
          "Dynamic QR Code Generator",
          "Passport Photo Maker",
          "Watermark Tool",
          "Photo Collage Maker",
          "Image Format Converter"
        ]
      },
      {
        "@type": "WebSite",
        "name": "Photo Studio",
        "url": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/search?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <>
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="max-w-6xl w-full space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Photo Studio
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional tools for your creative needs. Create stickers or crop perfect circles in seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/qr-code"
              className="group relative overflow-hidden rounded-3xl border bg-card p-4 hover:border-violet-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-2xl bg-violet-500/10 text-violet-600 group-hover:scale-110 transition-transform duration-300">
                  <LayoutGrid size={36} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">QR Code Studio</h2>
                  <p className="text-sm text-muted-foreground">
                    Generate custom QR codes or scan them directly with your camera.
                  </p>
                </div>
                <span className="inline-flex items-center justify-center rounded-full bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  Open Studio
                </span>
              </div>
            </Link>

            <Link
              href="/sticker-studio"
              className="group relative overflow-hidden rounded-3xl border bg-card p-4 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                  <Sticker size={36} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">Sticker Pro Studio</h2>
                  <p className="text-sm text-muted-foreground">
                    Create custom stickers with borders, export as PNG or ZIP, and organize into print-ready sheets.
                  </p>
                </div>
                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Launch Studio
                </span>
              </div>
            </Link>

            <Link
              href="/circle-cropper"
              className="group relative overflow-hidden rounded-3xl border bg-card p-4 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                  <Scissors size={36} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">Pro Circle Cropper</h2>
                  <p className="text-sm text-muted-foreground">
                    Crop images into perfect circles with adjustable borders, rotation, and zoom controls.
                  </p>
                </div>
                <span className="inline-flex items-center justify-center rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  Open Cropper
                </span>
              </div>
            </Link>

            <Link
              href="/passport-maker"
              className="group relative overflow-hidden rounded-3xl border bg-card p-4 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                  <UserSquare size={36} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">Passport Photo Maker</h2>
                  <p className="text-sm text-muted-foreground">
                    Create official ID photos. Auto-crop to standard sizes (US, EU, etc.) and print on 4x6 or A4 sheets.
                  </p>
                </div>
                <span className="inline-flex items-center justify-center rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  Start Making
                </span>
              </div>
            </Link>

            <Link
              href="/watermark"
              className="group relative overflow-hidden rounded-3xl border bg-card p-4 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                  <LayoutGrid size={36} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">Watermark Tool</h2>
                  <p className="text-sm text-muted-foreground">
                    Batch apply text or image watermarks. Protect your work with custom positioning and tiling.
                  </p>
                </div>
                <span className="inline-flex items-center justify-center rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  Open Tool
                </span>
              </div>
            </Link>

            <Link
              href="/collage"
              className="group relative overflow-hidden rounded-3xl border bg-card p-4 hover:border-pink-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-2xl bg-pink-500/10 text-pink-600 group-hover:scale-110 transition-transform duration-300">
                  <Layout size={36} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">Collage Maker</h2>
                  <p className="text-sm text-muted-foreground">
                    Combine photos into beautiful grids. Perfect for Instagram Stories and posts.
                  </p>
                </div>
                <span className="inline-flex items-center justify-center rounded-full bg-pink-500/10 px-4 py-1.5 text-sm font-medium text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                  Create Collage
                </span>
              </div>
            </Link>

            <Link
              href="/image-converter"
              className="group relative overflow-hidden rounded-3xl border bg-card p-4 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-600 group-hover:scale-110 transition-transform duration-300">
                  <RefreshCw size={36} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">Image Converter</h2>
                  <p className="text-sm text-muted-foreground">
                    Convert images between PNG, JPEG, and WebP formats with quality control and batch processing.
                  </p>
                </div>
                <span className="inline-flex items-center justify-center rounded-full bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  Start Converting
                </span>
              </div>
            </Link>
          </div>
        </div>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  )
}
