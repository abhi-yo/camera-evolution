'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface AnimatedCameraSvgProps {
  size?: number
  color?: string
  className?: string
  isDark?: boolean
}

export default function AnimatedCameraSvg({ 
  size = 200, 
  color,
  className = '',
  isDark = false
}: AnimatedCameraSvgProps) {
  const containerRef = useRef<SVGSVGElement>(null)
  const cameraRef = useRef<SVGGElement>(null)
  const lensOuterRef = useRef<SVGCircleElement>(null)
  const lensInnerRef = useRef<SVGCircleElement>(null)
  const lensCoreRef = useRef<SVGCircleElement>(null)
  const flashRef = useRef<SVGRectElement>(null)
  const buttonRef = useRef<SVGRectElement>(null)

  const strokeColor = color || (isDark ? '#ffffff' : '#171717')

  useEffect(() => {
    if (!cameraRef.current || !containerRef.current) return

    const ctx = gsap.context(() => {
      // Smooth entrance
      gsap.from(cameraRef.current, {
        scale: 0.85,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })

      // Gentle floating
      gsap.to(cameraRef.current, {
        y: -5,
        duration: 2.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      // Outer lens - slow rotation
      if (lensOuterRef.current) {
        gsap.to(lensOuterRef.current, {
          rotation: 360,
          transformOrigin: 'center center',
          duration: 15,
          ease: 'none',
          repeat: -1,
        })
      }

      // Inner lens - breathing
      if (lensInnerRef.current) {
        gsap.to(lensInnerRef.current, {
          scale: 0.9,
          transformOrigin: 'center center',
          duration: 2,
          ease: 'power1.inOut',
          repeat: -1,
          yoyo: true,
        })
      }

      // Core lens - subtle pulse
      if (lensCoreRef.current) {
        gsap.to(lensCoreRef.current, {
          scale: 1.1,
          opacity: 0.6,
          transformOrigin: 'center center',
          duration: 1.5,
          ease: 'power1.inOut',
          repeat: -1,
          yoyo: true,
        })
      }

      // Flash - gentle glow
      if (flashRef.current) {
        gsap.to(flashRef.current, {
          opacity: 0.5,
          duration: 1.2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: 0.5,
        })
      }

      // Shutter button press
      if (buttonRef.current) {
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 })
        tl.to(buttonRef.current, {
          y: 2,
          scaleY: 0.7,
          transformOrigin: 'center bottom',
          duration: 0.1,
          ease: 'power2.in',
        })
        tl.to(buttonRef.current, {
          y: 0,
          scaleY: 1,
          duration: 0.3,
          ease: 'elastic.out(1, 0.4)',
        })
      }

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <svg
      ref={containerRef}
      width={size}
      height={size * 0.75}
      viewBox="0 0 160 120"
      fill="none"
      className={className}
      aria-label="Animated camera"
    >
      <g ref={cameraRef}>
        {/* Camera Body */}
        <rect
          x="20"
          y="35"
          width="120"
          height="70"
          rx="10"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
        />

        {/* Viewfinder */}
        <rect
          x="55"
          y="22"
          width="30"
          height="15"
          rx="3"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
        />

        {/* Shutter Button */}
        <rect
          ref={buttonRef}
          x="120"
          y="25"
          width="14"
          height="12"
          rx="3"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
        />

        {/* Flash */}
        <rect
          ref={flashRef}
          x="30"
          y="42"
          width="16"
          height="10"
          rx="2"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
        />

        {/* Lens - Outer Ring with notches */}
        <g ref={lensOuterRef}>
          <circle
            cx="80"
            cy="70"
            r="30"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
          />
          {/* Lens grip notches */}
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180
            const x1 = 80 + 27 * Math.cos(rad)
            const y1 = 70 + 27 * Math.sin(rad)
            const x2 = 80 + 30 * Math.cos(rad)
            const y2 = 70 + 30 * Math.sin(rad)
            return (
              <line
                key={angle}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
            )
          })}
        </g>

        {/* Lens - Inner Ring */}
        <circle
          ref={lensInnerRef}
          cx="80"
          cy="70"
          r="20"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
        />

        {/* Lens - Core */}
        <circle
          ref={lensCoreRef}
          cx="80"
          cy="70"
          r="10"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
        />

        {/* Lens highlight */}
        <path
          d="M 72 62 A 12 12 0 0 1 88 62"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* Grip lines */}
        {[0, 1, 2].map((i) => (
          <line
            key={i}
            x1="125"
            y1={55 + i * 10}
            x2="132"
            y2={55 + i * 10}
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        ))}
      </g>
    </svg>
  )
}
