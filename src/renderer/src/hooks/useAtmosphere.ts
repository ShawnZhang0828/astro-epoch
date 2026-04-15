import { useEffect, useRef } from 'react'

/** Lightweight procedural ambience (no external audio files). */
export function useAtmosphere(key: string | undefined, playing: boolean) {
  const ref = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!playing || !key) return

    const ctx = new AudioContext()
    ref.current = ctx

    const bufferSize = 2 * ctx.sampleRate
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer
    src.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = key === 'glacier' ? 'bandpass' : key === 'station' ? 'lowpass' : 'lowpass'
    if (key === 'glacier') {
      filter.frequency.value = 800
      filter.Q.value = 0.4
    } else if (key === 'station') {
      filter.frequency.value = 180
      filter.Q.value = 2
    } else {
      filter.frequency.value = 320
      filter.Q.value = 0.8
    }

    const gain = ctx.createGain()
    gain.gain.value = key === 'station' ? 0.08 : 0.06

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = key === 'station' ? 55 : key === 'deepsea' ? 42 : 90
    const og = ctx.createGain()
    og.gain.value = key === 'station' ? 0.04 : 0.025
    osc.connect(og)
    og.connect(gain)

    src.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    src.start()
    osc.start()

    const onVisibility = () => {
      if (document.hidden) void ctx.suspend()
      else void ctx.resume().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibility)
    onVisibility()

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      try {
        src.stop()
        osc.stop()
      } catch {
        /* */
      }
      void ctx.close()
      ref.current = null
    }
  }, [key, playing])
}
