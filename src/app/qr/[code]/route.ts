import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db.server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params

    try {
        const { db } = await connectToDatabase()
        const qrCodes = db.collection('qrcodes')

        // Find QR Code by shortCode
        const qrCode = await qrCodes.findOne({ shortCode: code })

        // Handle Not Found or Inactive
        if (!qrCode || !qrCode.isActive) {
            return new NextResponse('QR Code not found or inactive', { status: 404 })
        }

        // Extract Analytics Info
        const headersList = await headers()
        const userAgent = headersList.get('user-agent') || 'Unknown'
        const ip = headersList.get('x-forwarded-for') || 'Unknown'
        // Basic Geo from headers
        const country = headersList.get('x-vercel-ip-country') ||
            headersList.get('cf-ipcountry') ||
            'Unknown'
        const city = headersList.get('x-vercel-ip-city') || 'Unknown'

        // Async Update Stats
        await qrCodes.updateOne(
            { _id: qrCode._id },
            {
                $inc: { scans: 1 },
                $push: {
                    scanHistory: {
                        timestamp: new Date(),
                        userAgent,
                        ip,
                        country,
                        city
                    }
                } as any
            }
        )

        // Redirect or Serve Content based on Type
        const content = qrCode.content || {}
        const type = qrCode.type || 'url'

        if (type === 'url') {
            // Handle URL Redirection
            let destination = ''
            if (typeof content === 'string') {
                destination = content
            } else if (content.url) {
                destination = content.url
            }

            if (!destination) {
                return new NextResponse('Destination URL missing', { status: 400 })
            }

            if (!destination.startsWith('http')) {
                destination = 'https://' + destination
            }

            return NextResponse.redirect(destination)

        } else if (type === 'text') {
            // Serve Text Page
            const text = typeof content === 'string' ? content : (content.text || '')
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Message</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f0f2f5; }
                        .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 90%; width: 400px; text-align: center; }
                        h1 { color: #1a1a1a; margin-bottom: 1rem; font-size: 1.5rem; }
                        p { color: #4a4a4a; line-height: 1.5; white-space: pre-wrap; margin-bottom: 0; font-size: 1.1rem; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>Message</h1>
                        <p>${text}</p>
                    </div>
                </body>
                </html>
            `
            return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })

        } else if (type === 'wifi') {
            // Serve WiFi Page
            const ssid = content.ssid || ''
            const password = content.password || ''
            const encryption = content.encryption || 'WPA'

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Wi-Fi Network</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #1a1a1a; color: white; }
                        .card { background: #2a2a2a; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); max-width: 90%; width: 350px; text-align: center; }
                        .icon { font-size: 3rem; margin-bottom: 1rem; }
                        h1 { margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 500; color: #a1a1aa; }
                        .ssid { font-size: 2rem; font-weight: bold; margin-bottom: 2rem; color: #fff; }
                        .field { background: #3f3f46; padding: 1rem; border-radius: 0.75rem; margin-bottom: 1rem; text-align: left; }
                        .label { font-size: 0.75rem; color: #a1a1aa; display: block; margin-bottom: 0.25rem; }
                        .value { font-size: 1.1rem; color: #fff; font-family: monospace; display: flex; justify-content: space-between; align-items: center; }
                        .copy { background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 0.875rem; padding: 0.25rem 0.5rem; }
                        .copy:active { opacity: 0.7; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="icon">📶</div>
                        <h1>Wi-Fi Network</h1>
                        <div class="ssid">${ssid}</div>
                        
                        <div class="field">
                            <span class="label">Password</span>
                            <div class="value">
                                <span>${password}</span>
                                <button class="copy" onclick="navigator.clipboard.writeText('${password}')">Copy</button>
                            </div>
                        </div>
                        
                        <div class="field">
                            <span class="label">Encryption</span>
                            <div class="value">${encryption}</div>
                        </div>
                    </div>
                </body>
                </html>
            `
            return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })

        } else if (type === 'biopage') {
            // Serve Bio Page (Updated UI)
            const title = content.title || 'My Links'
            const description = content.description || ''
            const links = Array.isArray(content.links) ? content.links : []

            const html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${title}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Inter', sans-serif; }
                        .glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
                    </style>
                </head>
                <body class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
                    <div class="w-full max-w-md">
                        <div class="glass rounded-3xl p-8 shadow-2xl border border-white/20 text-center relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-purple-600"></div>
                            
                            <div class="w-24 h-24 bg-white rounded-full mx-auto mb-6 flex items-center justify-center text-4xl font-bold text-indigo-600 shadow-lg border-4 border-white/50">
                                ${title.charAt(0).toUpperCase()}
                            </div>
                            
                            <h1 class="text-2xl font-bold text-gray-900 mb-2 tracking-tight">${title}</h1>
                            ${description ? `<div class="text-gray-700 mb-8 font-medium leading-relaxed bg-white/40 p-3 rounded-xl inline-block backdrop-blur-sm">${description}</div>` : ''}
                            
                            <div class="space-y-4 relative z-10">
                                ${links.map((link: any) => `
                                    <a href="${link.url}" target="_blank" rel="noopener" 
                                       class="block w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-4 px-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100/50 flex items-center justify-between group">
                                        <span class="group-hover:text-indigo-600 transition-colors">${link.label || 'Link'}</span>
                                        <div class="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </a>
                                `).join('')}
                            </div>

                             <div class="mt-10 pt-6 border-t border-gray-200/20">
                                <p class="text-[10px] text-white/80 font-medium tracking-widest uppercase">Powered by QR Master</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
            return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })

        } else if (type === 'vcard') {
            // Check for vCard Download
            const url = new URL(request.url)
            const isDownload = url.searchParams.get('download') === 'true'

            const firstName = content.firstName || ''
            const lastName = content.lastName || ''
            const fn = `${firstName} ${lastName}`.trim()
            const phone = content.phone || ''
            const email = content.email || ''
            const org = content.company || ''
            const title = content.jobTitle || ''
            const website = content.website || ''
            const address = content.address || ''

            // Generate VCF Content
            const vcf = [
                'BEGIN:VCARD',
                'VERSION:3.0',
                `N:${lastName};${firstName};;;`,
                `FN:${fn}`,
                org ? `ORG:${org}` : '',
                title ? `TITLE:${title}` : '',
                phone ? `TEL;TYPE=CELL:${phone}` : '',
                email ? `EMAIL:${email}` : '',
                website ? `URL:${website}` : '',
                address ? `ADR:;;${address.replace(/\n/g, ';')};;;;` : '',
                'END:VCARD'
            ].filter(Boolean).join('\n')

            if (isDownload) {
                return new NextResponse(vcf, {
                    headers: {
                        'Content-Type': 'text/vcard',
                        'Content-Disposition': `attachment; filename="${fn || 'contact'}.vcf"`
                    }
                })
            }

            // Serve Contact Profile Page (Updated UI)
            const html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${fn}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Inter', sans-serif; }
                    </style>
                </head>
                <body class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div class="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                        <!-- Header / Banner placeholder -->
                        <div class="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                             <div class="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                                <div class="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                                    <div class="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-500">
                                        ${firstName.charAt(0)}${lastName.charAt(0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="pt-12 pb-8 px-6 text-center">
                            <h1 class="text-2xl font-bold text-gray-900">${fn}</h1>
                            ${title ? `<p class="text-indigo-600 font-medium text-sm mt-1">${title}</p>` : ''}
                             ${org ? `<p class="text-gray-500 text-sm">${org}</p>` : ''}
                            
                            <div class="mt-8 space-y-3">
                                <a href="?download=true" class="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                    </svg>
                                    Save Contact
                                </a>
                            </div>

                            <div class="mt-8 space-y-4 text-left">
                                ${phone ? `
                                    <a href="tel:${phone}" class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                                        <div class="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p class="text-xs text-gray-500 uppercase tracking-wide">Mobile</p>
                                            <p class="font-medium text-gray-900">${phone}</p>
                                        </div>
                                    </a>
                                ` : ''}

                                ${email ? `
                                    <a href="mailto:${email}" class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                                        <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p class="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                                            <p class="font-medium text-gray-900 break-all">${email}</p>
                                        </div>
                                    </a>
                                ` : ''}

                                ${website ? `
                                    <a href="${website}" target="_blank" class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                                        <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p class="text-xs text-gray-500 uppercase tracking-wide">Website</p>
                                            <p class="font-medium text-gray-900 break-all">${website}</p>
                                        </div>
                                    </a>
                                ` : ''}

                                ${address ? `
                                    <div class="flex items-center gap-4 p-3 rounded-xl">
                                        <div class="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p class="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                                            <p class="font-medium text-gray-900 whitespace-pre-line">${address}</p>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
            return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
        }

        // Default / Unknown Type fallback
        return new NextResponse('Unsupported QR Code Type', { status: 400 })

    } catch (error) {
        console.error('Redirection error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
