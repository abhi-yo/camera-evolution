'use client'

import { useEffect, useRef, useState } from 'react'
import AnimatedCameraSvg from './AnimatedCameraSvg'

const ERAS = [
  {
    id: 'daguerreotype',
    name: 'Daguerreotype',
    year: 1839,
    filter: 'grayscale(100%) contrast(130%) brightness(85%) blur(0.5px)',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: 16/9,
    colorDepth: 6, // Reduced gradation for vintage look (64 levels)
    exposure: 'long', // Long exposure = motion blur
  },
  {
    id: 'wet-plate',
    name: 'Wet Plate Collodion',
    year: 1855,
    filter: 'grayscale(100%) contrast(140%) brightness(95%) blur(0.4px)',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: 16/9,
    colorDepth: 7, // Better grayscale gradation (128 levels)
    exposure: 'medium',
  },
  {
    id: 'early-film',
    name: 'Early Film',
    year: 1900,
    filter: 'grayscale(100%) contrast(95%) brightness(88%)',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: 16/9,
    colorDepth: 8, // 256 shades of gray
    exposure: 'normal',
  },
  {
    id: 'noir',
    name: 'Noir',
    year: 1930,
    filter: 'grayscale(100%) contrast(140%) brightness(90%)',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: 16/9,
    colorDepth: 8,
    exposure: 'normal',
  },
  {
    id: 'kodachrome',
    name: 'Kodachrome',
    year: 1960,
    filter: 'saturate(140%) contrast(115%) brightness(95%) hue-rotate(-2deg)',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: 16/9,
    colorDepth: 24, // Full color but film grain
    exposure: 'normal',
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    year: 1980,
    filter: 'contrast(75%) saturate(85%) brightness(115%) blur(0.6px)',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: 16/9,
    colorDepth: 16, // Limited instant film color
    exposure: 'normal',
  },
  {
    id: 'early-digital',
    name: 'Early Digital',
    year: 2000,
    filter: 'contrast(125%) saturate(110%) brightness(95%)',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: 16/9,
    colorDepth: 16, // 16-bit color (65K colors)
    exposure: 'fast',
  },
  {
    id: 'smartphone-hdr',
    name: 'Smartphone HDR',
    year: 2010,
    filter: 'contrast(135%) saturate(140%) brightness(108%)',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: 16/9,
    colorDepth: 24,
    exposure: 'fast',
  },
  {
    id: 'modern',
    name: 'Modern',
    year: 2018,
    filter: 'none',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: 16/9,
    colorDepth: 32, // Full color + alpha
    exposure: 'fast',
  },
]

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentEra, setCurrentEra] = useState(0)
  const [hasPermission, setHasPermission] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [format, setFormat] = useState<'square' | 'portrait' | 'landscape'>('square')
  const [showGallery, setShowGallery] = useState(false)
  const [gallery, setGallery] = useState<Array<{ id: string, dataUrl: string, era: string, format: string, timestamp: number }>>([])
  const [isDarkMode, setIsDarkMode] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('camera-evolution-theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
    }
  }, [])

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('camera-evolution-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  // Load gallery from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('camera-evolution-gallery')
    if (saved) {
      try {
        setGallery(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load gallery:', e)
      }
    }
  }, [])

  // Save to localStorage whenever gallery changes
  useEffect(() => {
    if (gallery.length > 0) {
      localStorage.setItem('camera-evolution-gallery', JSON.stringify(gallery))
    }
  }, [gallery])

  const deletePhoto = (id: string) => {
    setGallery(prev => prev.filter(photo => photo.id !== id))
    if (gallery.length === 1) {
      localStorage.removeItem('camera-evolution-gallery')
    }
  }

  const downloadImage = (dataUrl: string, filename: string) => {
    try {
      // Convert base64 dataUrl to Blob for more reliable download
      const byteString = atob(dataUrl.split(',')[1])
      const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0]
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      
      const blob = new Blob([ab], { type: mimeString })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (err) {
      console.error('Download failed:', err)
      // Fallback method
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      setTimeout(() => document.body.removeChild(link), 100)
    }
  }

  useEffect(() => {
    let ignore = false

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        })
        if (!ignore) {
          streamRef.current = stream
          setHasPermission(true)
        } else {
          // If we ignored this result (component unmounted), clean it up immediately
          stream.getTracks().forEach(track => track.stop())
        }
      } catch (err) {
        console.error('Camera access denied:', err)
        setHasPermission(false)
      }
    }

    startCamera()

    return () => {
      ignore = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (hasPermission && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [hasPermission])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          setCurrentEra(prev => Math.max(0, prev - 1))
          break
        case 'ArrowRight':
          e.preventDefault()
          setCurrentEra(prev => Math.min(ERAS.length - 1, prev + 1))
          break
        case ' ':
          e.preventDefault()
          capturePhoto()
          break
        case '1':
          e.preventDefault()
          setFormat('square')
          break
        case '2':
          e.preventDefault()
          setFormat('portrait')
          break
        case '3':
          e.preventDefault()
          setFormat('landscape')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentEra, format])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const context = canvasRef.current.getContext('2d', { willReadFrequently: true })
    if (!context) return

    const era = ERAS[currentEra]
    const videoW = videoRef.current.videoWidth
    const videoH = videoRef.current.videoHeight
    
    // Calculate aspect ratio based on Instagram format
    let targetAspect: number
    let w: number
    let h: number
    
    if (format === 'square') {
      targetAspect = 1 // 1:1
      w = 1080
      h = 1080
    } else if (format === 'portrait') {
      targetAspect = 4/5 // 4:5
      w = 1080
      h = 1350
    } else {
      targetAspect = 1.91 // 1.91:1 (Instagram landscape)
      w = 1080
      h = 566
    }
    
    // Calculate dimensions based on format and aspect ratio
    let sourceW = videoW
    let sourceH = videoH
    let sourceX = 0
    let sourceY = 0
    
    const videoAspect = videoW / videoH
    
    // Crop to match target aspect ratio
    if (videoAspect > targetAspect) {
      // Video is wider, crop sides
      sourceW = videoH * targetAspect
      sourceX = (videoW - sourceW) / 2
    } else {
      // Video is taller, crop top/bottom
      sourceH = videoW / targetAspect
      sourceY = (videoH - sourceH) / 2
    }
    
    canvasRef.current.width = w
    canvasRef.current.height = h

    // Apply base filter and draw image WITH resolution downsampling
    context.filter = era.filter
    context.imageSmoothingEnabled = false // Pixelated downsampling for authenticity
    context.drawImage(videoRef.current, sourceX, sourceY, sourceW, sourceH, 0, 0, w, h)
    
    // For long exposure (daguerreotype), add motion blur
    if (era.exposure === 'long') {
      context.globalAlpha = 0.3
      context.filter = 'blur(2px)'
      for (let i = 0; i < 3; i++) {
        context.drawImage(canvasRef.current, 0, 0)
      }
      context.globalAlpha = 1
    }
    
    // Reduce color depth to simulate era limitations
    if (era.colorDepth < 24) {
      const imageData = context.getImageData(0, 0, w, h)
      const data = imageData.data
      const levels = Math.pow(2, era.colorDepth)
      const step = 256 / levels
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.floor(data[i] / step) * step // Red
        data[i + 1] = Math.floor(data[i + 1] / step) * step // Green
        data[i + 2] = Math.floor(data[i + 2] / step) * step // Blue
      }
      context.putImageData(imageData, 0, 0)
    }
    
    // Reset filter for post-processing
    context.filter = 'none'

    // Apply era-specific advanced effects
    const eraId = era.id

    switch (eraId) {
      case 'daguerreotype':
        // Much stronger metallic sheen
        const metallicGradient = context.createRadialGradient(
          w/2, h/2, w*0.05,
          w/2, h/2, w*0.65
        )
        metallicGradient.addColorStop(0, 'rgba(255,255,255,0.15)')
        metallicGradient.addColorStop(0.6, 'rgba(200,200,200,0)')
        metallicGradient.addColorStop(1, 'rgba(0,0,0,0.45)')
        context.fillStyle = metallicGradient
        context.fillRect(0, 0, w, h)

        // Lighter vignette
        context.globalCompositeOperation = 'multiply'
        const daguerreVignette = context.createRadialGradient(
          w/2, h/2, w*0.3, // Larger inner radius
          w/2, h/2, w*0.9  // Larger outer radius
        )
        daguerreVignette.addColorStop(0, 'rgba(255,255,255,1)')
        daguerreVignette.addColorStop(0.6, 'rgba(180,180,180,1)') // Lighter gray
        daguerreVignette.addColorStop(1, 'rgba(50,50,50,0.4)') // Much lighter edge
        context.fillStyle = daguerreVignette
        context.fillRect(0, 0, w, h)
        context.globalCompositeOperation = 'source-over'
        
        // Edge blur (center was sharper)
        context.globalCompositeOperation = 'destination-in'
        const edgeMask = context.createRadialGradient(
          w/2, h/2, w*0.3,
          w/2, h/2, w*0.6
        )
        edgeMask.addColorStop(0, 'rgba(255,255,255,1)')
        edgeMask.addColorStop(0.8, 'rgba(255,255,255,0.9)')
        edgeMask.addColorStop(1, 'rgba(255,255,255,0.75)')
        context.fillStyle = edgeMask
        context.fillRect(0, 0, w, h)
        context.globalCompositeOperation = 'source-over'
        break

      case 'wet-plate':
        // Uneven exposure with hot spots
        const hotSpotX = w * (0.3 + Math.random() * 0.4)
        const hotSpotY = h * (0.2 + Math.random() * 0.3)
        const hotSpot = context.createRadialGradient(
          hotSpotX, hotSpotY, w*0.05,
          hotSpotX, hotSpotY, w*0.4
        )
        hotSpot.addColorStop(0, 'rgba(255,255,255,0.2)')
        hotSpot.addColorStop(1, 'rgba(255,255,255,0)')
        context.fillStyle = hotSpot
        context.fillRect(0, 0, w, h)

        // Glowing faces (overexposed highlights)
        context.globalAlpha = 0.25
        context.filter = 'blur(6px) brightness(140%)'
        context.drawImage(canvasRef.current, 0, 0)
        context.globalAlpha = 1
        context.filter = 'none'
        
        // Deep shadows
        context.globalCompositeOperation = 'multiply'
        context.fillStyle = 'rgba(0,0,0,0.15)'
        context.fillRect(0, 0, w, h)
        context.globalCompositeOperation = 'source-over'
        break

      case 'early-film':
        // Much heavier film grain (3x density)
        for (let i = 0; i < 24000; i++) {
          const x = Math.random() * w
          const y = Math.random() * h
          const opacity = Math.random() * 0.12
          context.fillStyle = `rgba(0,0,0,${opacity})`
          context.fillRect(x, y, 1, 1)
        }

        // More scratches (vertical artifacts)
        for (let i = 0; i < 8; i++) {
          const opacity = Math.random() * 0.08 + 0.02
          context.strokeStyle = `rgba(255,255,255,${opacity})`
          context.lineWidth = Math.random() < 0.7 ? 1 : 2
          context.beginPath()
          const xPos = Math.random() * w
          context.moveTo(xPos, 0)
          context.lineTo(xPos + (Math.random() - 0.5) * 10, h)
          context.stroke()
        }
        
        // Dust spots
        for (let i = 0; i < 15; i++) {
          context.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`
          context.beginPath()
          context.arc(Math.random() * w, Math.random() * h, Math.random() * 3, 0, Math.PI * 2)
          context.fill()
        }
        break

      case 'sepia':
        // Warmer, more authentic sepia tone
        context.fillStyle = 'rgba(120,80,40,0.12)'
        context.fillRect(0, 0, w, h)
        
        // Romantic softness with edge glow
        context.globalAlpha = 0.2
        context.filter = 'blur(4px) brightness(110%)'
        context.drawImage(canvasRef.current, 0, 0)
        context.globalAlpha = 1
        context.filter = 'none'
        
        // Slight vignette
        context.globalCompositeOperation = 'multiply'
        const sepiaVignette = context.createRadialGradient(
          w/2, h/2, w*0.3,
          w/2, h/2, w*0.7
        )
        sepiaVignette.addColorStop(0, 'rgba(255,255,255,1)')
        sepiaVignette.addColorStop(1, 'rgba(100,80,60,0.85)')
        context.fillStyle = sepiaVignette
        context.fillRect(0, 0, w, h)
        context.globalCompositeOperation = 'source-over'
        break

      case 'kodachrome':
        // Characteristic Kodachrome color: rich reds and yellows
        context.fillStyle = 'rgba(255,60,0,0.08)'
        context.fillRect(0, 0, w, h)
        
        // Boost in blues/cyans (Kodachrome's signature look)
        context.fillStyle = 'rgba(0,80,120,0.04)'
        context.globalCompositeOperation = 'screen'
        context.fillRect(0, 0, w, h)
        context.globalCompositeOperation = 'source-over'
        
        // Deep blacks (Kodachrome was known for rich blacks)
        context.globalCompositeOperation = 'multiply'
        context.fillStyle = 'rgba(0,0,0,0.08)'
        context.fillRect(0, 0, w, h)
        context.globalCompositeOperation = 'source-over'
        break

      case 'polaroid':
        // Characteristic cyan/cool color cast
        context.fillStyle = 'rgba(160,200,255,0.15)'
        context.fillRect(0, 0, w, h)
        
        // Slight magenta in shadows
        context.globalCompositeOperation = 'multiply'
        context.fillStyle = 'rgba(255,240,255,0.95)'
        context.fillRect(0, 0, w, h)
        context.globalCompositeOperation = 'source-over'

        // Soft, dreamy quality
        context.globalAlpha = 0.15
        context.filter = 'blur(2px)'
        context.drawImage(canvasRef.current, 0, 0)
        context.globalAlpha = 1
        context.filter = 'none'

        // Heavy edge fade (classic Polaroid look)
        context.globalCompositeOperation = 'multiply'
        const polaroidGradient = context.createRadialGradient(
          w/2, h/2, w*0.25,
          w/2, h/2, w*0.75
        )
        polaroidGradient.addColorStop(0, 'rgba(255,255,255,1)')
        polaroidGradient.addColorStop(0.7, 'rgba(230,230,240,1)')
        polaroidGradient.addColorStop(1, 'rgba(180,180,200,0.75)')
        context.fillStyle = polaroidGradient
        context.fillRect(0, 0, w, h)
        context.globalCompositeOperation = 'source-over'
        break

      case 'early-digital':
        // Over-sharpen artifact
        context.globalAlpha = 0.35
        context.drawImage(canvasRef.current, -1, 0)
        context.drawImage(canvasRef.current, 1, 0)
        context.globalAlpha = 1

        // CCD noise (color noise)
        for (let i = 0; i < 3000; i++) {
          const x = Math.random() * w
          const y = Math.random() * h
          const r = Math.floor(Math.random() * 80)
          const g = Math.floor(Math.random() * 80)
          const b = Math.floor(Math.random() * 80)
          context.fillStyle = `rgba(${r},${g},${b},0.08)`
          context.fillRect(x, y, 1, 1)
        }
        break

      case 'smartphone-hdr':
        // Over-processed HDR halo
        context.globalAlpha = 0.28
        context.filter = 'blur(12px) brightness(130%)'
        context.drawImage(canvasRef.current, 0, 0)
        context.globalAlpha = 1
        context.filter = 'none'
        
        // Unrealistic highlight recovery
        context.fillStyle = 'rgba(255,255,255,0.08)'
        context.fillRect(0, 0, w, h)
        
        // Pumped shadows
        context.globalCompositeOperation = 'screen'
        context.fillStyle = 'rgba(40,40,40,0.15)'
        context.fillRect(0, 0, w, h)
        context.globalCompositeOperation = 'source-over'
        break

      case 'modern':
        // Keep modern clean - no effects
        break
    }

    setIsCapturing(true)
    setTimeout(() => setIsCapturing(false), 200)

    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95)
    
    // Save to gallery
    const newPhoto = {
      id: Date.now().toString(),
      dataUrl,
      era: ERAS[currentEra].name,
      format,
      timestamp: Date.now()
    }
    setGallery(prev => [newPhoto, ...prev])

    // Download file
    downloadImage(dataUrl, `${ERAS[currentEra].id}-${Date.now()}.jpg`)
  }

  if (!hasPermission) {
    return (
      <div 
        className={`${isDarkMode ? 'dark' : ''} flex items-center justify-center min-h-screen transition-colors duration-300`}
        style={{ background: 'var(--layer-0)' }}
      >
        <div className="text-center">
          <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>Camera Evolution</h1>
          <p className={isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}>Please allow camera access to continue</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`${isDarkMode ? 'dark' : ''} min-h-screen flex items-center justify-center p-3 sm:p-6 transition-colors duration-300`}
      style={{ background: 'var(--layer-0)' }}
    >
      {/* Theme Toggle - Elevated Button */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-3 right-3 sm:top-6 sm:right-6 p-2.5 sm:p-3 rounded-full transition-all duration-200 z-50`}
        style={{ 
          background: 'var(--layer-3)',
          boxShadow: 'var(--shadow-md)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
        onMouseDown={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-inset)'}
        onMouseUp={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
        aria-label="Toggle theme"
      >
        {isDarkMode ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white sm:w-5 sm:h-5">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-800 sm:w-5 sm:h-5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>

      <div className="w-full max-w-3xl">
        {/* Format Toggle - Compact on mobile */}
        <div 
          className="flex justify-center gap-1 sm:gap-2 mb-4 sm:mb-8 p-1 sm:p-1.5 rounded-full mx-auto w-fit"
          style={{ 
            background: 'var(--layer-1)',
            boxShadow: 'var(--shadow-inset)'
          }}
        >
          <button
            onClick={() => setFormat('square')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
              format === 'square'
                ? isDarkMode ? 'text-black' : 'text-white'
                : isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
            }`}
            style={{ 
              background: format === 'square' 
                ? isDarkMode ? '#ffffff' : '#000000'
                : 'transparent',
              boxShadow: format === 'square' ? 'var(--shadow-md)' : 'none'
            }}
          >
            <span className="flex items-center gap-1 sm:gap-2">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="sm:w-3.5 sm:h-3.5">
                <rect width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
              <span className="hidden sm:inline">Square</span>
              <span className="sm:hidden">1:1</span>
            </span>
          </button>
          <button
            onClick={() => setFormat('portrait')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
              format === 'portrait'
                ? isDarkMode ? 'text-black' : 'text-white'
                : isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
            }`}
            style={{ 
              background: format === 'portrait' 
                ? isDarkMode ? '#ffffff' : '#000000'
                : 'transparent',
              boxShadow: format === 'portrait' ? 'var(--shadow-md)' : 'none'
            }}
          >
            <span className="flex items-center gap-1 sm:gap-2">
              <svg width="10" height="14" viewBox="0 0 12 16" fill="none" className="sm:w-3 sm:h-4">
                <rect width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
              <span className="hidden sm:inline">Portrait</span>
              <span className="sm:hidden">4:5</span>
            </span>
          </button>
          <button
            onClick={() => setFormat('landscape')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
              format === 'landscape'
                ? isDarkMode ? 'text-black' : 'text-white'
                : isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
            }`}
            style={{ 
              background: format === 'landscape' 
                ? isDarkMode ? '#ffffff' : '#000000'
                : 'transparent',
              boxShadow: format === 'landscape' ? 'var(--shadow-md)' : 'none'
            }}
          >
            <span className="flex items-center gap-1 sm:gap-2">
              <svg width="16" height="9" viewBox="0 0 18 10" fill="none" className="sm:w-4 sm:h-2.5">
                <rect width="18" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
              <span className="hidden sm:inline">Landscape</span>
              <span className="sm:hidden">16:9</span>
            </span>
          </button>
        </div>

        {/* Video Preview - Maximum Elevation Card */}
        <div 
          className="relative bg-black rounded-xl sm:rounded-2xl overflow-hidden mx-auto"
          style={{
            aspectRatio: format === 'square' ? '1' : format === 'portrait' ? '4/5' : '1.91',
            maxWidth: format === 'square' ? '560px' : format === 'portrait' ? '560px' : '100%',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover transition-all duration-500 ease-in-out"
            style={{
              filter: ERAS[currentEra].filter,
            }}
          />
          {isCapturing && (
            <div className="absolute inset-0 bg-white opacity-30 pointer-events-none" />
          )}
        </div>

        {/* Era Info - Clean Typography */}
        <div className="mt-3 sm:mt-6 text-center space-y-0.5 sm:space-y-1">
          <h2 className={`text-lg sm:text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
            {ERAS[currentEra].name}
          </h2>
          <p className={`text-sm sm:text-base ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>{ERAS[currentEra].year}</p>
          <p className={`text-[10px] sm:text-xs font-mono tracking-wide ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
            {format === 'square' ? '1080×1080' : format === 'portrait' ? '1080×1350' : '1080×566'} · 
            {format === 'square' ? ' 1:1' : format === 'portrait' ? ' 4:5' : ' 1.91:1'} · 
            {ERAS[currentEra].colorDepth}-bit
          </p>
        </div>

        {/* Timeline Slider - Recessed Track */}
        <div className="mt-3 sm:mt-6 px-1 sm:px-2">
          <div 
            className="relative p-2 sm:p-3 rounded-lg sm:rounded-xl"
            style={{ 
              background: 'var(--layer-1)',
              boxShadow: 'var(--shadow-inset-deep)'
            }}
          >
            <input
              type="range"
              min="0"
              max={ERAS.length - 1}
              value={currentEra}
              onChange={(e) => setCurrentEra(parseInt(e.target.value))}
              className={`w-full h-1.5 rounded-full appearance-none cursor-pointer slider ${isDarkMode ? 'slider-dark' : ''}`}
            />
            {/* Era Markers */}
            <div className="flex justify-between mt-2 sm:mt-3 px-0.5 sm:px-1">
              {ERAS.map((era, index) => (
                <button
                  key={era.id}
                  onClick={() => setCurrentEra(index)}
                  className={`text-[10px] sm:text-xs transition-all px-1 sm:px-2 py-0.5 sm:py-1 rounded ${
                    currentEra === index
                      ? isDarkMode ? 'text-white font-semibold' : 'text-neutral-900 font-semibold'
                      : isDarkMode ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                  style={{
                    background: currentEra === index ? 'var(--layer-3)' : 'transparent',
                    boxShadow: currentEra === index ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  {era.year}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 sm:gap-4 mt-4 sm:mt-6">
          {/* Gallery Button - Elevated */}
          <button
            onClick={() => setShowGallery(true)}
            className={`flex-1 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-lg sm:rounded-xl transition-all duration-200 relative`}
            style={{ 
              background: 'var(--layer-3)',
              boxShadow: 'var(--btn-shadow)',
              color: isDarkMode ? '#ffffff' : '#171717'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--btn-shadow-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--btn-shadow)'}
            onMouseDown={(e) => {
              e.currentTarget.style.boxShadow = 'var(--btn-shadow-active)';
              e.currentTarget.style.transform = 'translateY(1px)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.boxShadow = 'var(--btn-shadow-hover)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Gallery
            {gallery.length > 0 && (
              <span 
                className={`absolute -top-2 -right-2 text-xs font-bold px-2 py-1 rounded-full ${
                  isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                }`}
                style={{ boxShadow: 'var(--shadow-md)' }}
              >
                {gallery.length}
              </span>
            )}
          </button>
          
          {/* Capture Button - Primary Elevated */}
          <button
            onClick={capturePhoto}
            className={`flex-1 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-lg sm:rounded-xl transition-all duration-200`}
            style={{ 
              background: isDarkMode ? '#ffffff' : '#000000',
              color: isDarkMode ? '#000000' : '#ffffff',
              boxShadow: 'var(--shadow-lg)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-xl)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
            onMouseDown={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-inset)';
              e.currentTarget.style.transform = 'translateY(2px)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Capture
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      
      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${isDarkMode ? 'white' : 'black'};
          cursor: pointer;
          border: 3px solid ${isDarkMode ? '#171717' : 'white'};
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          margin-top: -7px;
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${isDarkMode ? 'white' : 'black'};
          cursor: pointer;
          border: none;
        }
        
        .slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          background: ${currentEra > 0 
            ? `linear-gradient(to right, ${isDarkMode ? 'white' : 'black'} ${(currentEra / (ERAS.length - 1)) * 100}%, ${isDarkMode ? '#404040' : '#e5e5e5'} ${(currentEra / (ERAS.length - 1)) * 100}%)` 
            : isDarkMode ? '#404040' : '#e5e5e5'};
          border-radius: 9999px;
        }
        
        .slider::-moz-range-track {
          width: 100%;
          height: 6px;
          background: ${currentEra > 0 
            ? `linear-gradient(to right, ${isDarkMode ? 'white' : 'black'} ${(currentEra / (ERAS.length - 1)) * 100}%, ${isDarkMode ? '#404040' : '#e5e5e5'} ${(currentEra / (ERAS.length - 1)) * 100}%)` 
            : isDarkMode ? '#404040' : '#e5e5e5'};
          border-radius: 9999px;
        }
      `}</style>

      {/* Gallery Modal */}
      {showGallery && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50"
          onClick={() => setShowGallery(false)}
        >
          <div 
            className="rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ 
              background: 'var(--layer-4)',
              boxShadow: 'var(--shadow-xl)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className={`text-lg sm:text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>Gallery ({gallery.length})</h2>
              <button
                onClick={() => setShowGallery(false)}
                className="p-1.5 sm:p-2 rounded-full transition-all duration-200"
                style={{ 
                  background: 'var(--layer-2)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`sm:w-6 sm:h-6 ${isDarkMode ? 'text-white' : 'text-neutral-800'}`}>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {gallery.length === 0 ? (
              <div 
                className={`text-center py-8 sm:py-12 rounded-lg sm:rounded-xl text-sm sm:text-base ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}
                style={{ 
                  background: 'var(--layer-1)',
                  boxShadow: 'var(--shadow-inset)'
                }}
              >
                <p>No photos yet. Capture your first photo!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {gallery.map((photo) => (
                  <div 
                    key={photo.id} 
                    className="rounded-lg sm:rounded-xl overflow-hidden transition-all duration-200"
                    style={{ 
                      background: 'var(--layer-3)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <div className="relative aspect-square">
                      <img
                        src={photo.dataUrl}
                        alt={`${photo.era} - ${photo.format}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                    </div>
                    
                    <div className="p-2 sm:p-3">
                      <div className="mb-2 sm:mb-3">
                        <p className={`font-semibold text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>{photo.era}</p>
                        <div className="flex justify-between items-center mt-0.5 sm:mt-1">
                          <p className={`text-[10px] sm:text-xs capitalize ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>{photo.format}</p>
                          <p className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>{new Date(photo.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5 sm:gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadImage(photo.dataUrl, `${photo.era}-${photo.timestamp}.jpg`)
                          }}
                          className="flex-1 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium rounded sm:rounded-lg transition-all duration-200"
                          style={{ 
                            background: 'var(--layer-2)',
                            boxShadow: 'var(--btn-shadow)',
                            color: isDarkMode ? '#ffffff' : '#171717'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--btn-shadow-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--btn-shadow)'}
                        >
                          Download
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePhoto(photo.id)
                          }}
                          className={`flex-1 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium rounded sm:rounded-lg transition-all duration-200 ${
                            isDarkMode 
                              ? 'text-red-400' 
                              : 'text-red-600'
                          }`}
                          style={{ 
                            background: isDarkMode ? 'rgba(127, 29, 29, 0.3)' : 'rgba(254, 226, 226, 1)',
                            boxShadow: 'var(--btn-shadow)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--btn-shadow-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--btn-shadow)'}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
