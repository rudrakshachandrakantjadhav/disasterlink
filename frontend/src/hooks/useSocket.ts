'use client'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import socket from '@/socket/socket'

export function useSocket() {
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !user) return
    
    socket.connect()
    socket.emit('join-room', { role: user.role, userId: user.id })

    socket.on('new-sos', (data) => {
      console.log('New SOS:', data)
      window.dispatchEvent(new CustomEvent('new-sos', { detail: data }))
    })
    socket.on('map-update', (data) => {
      window.dispatchEvent(new CustomEvent('map-update', { detail: data }))
    })
    socket.on('volunteer-assigned', (data) => {
      window.dispatchEvent(new CustomEvent('volunteer-assigned', { detail: data }))
    })
    socket.on('emergency-alert', (data) => {
      window.dispatchEvent(new CustomEvent('emergency-alert', { detail: data }))
    })
    socket.on('sos-status-update', (data) => {
      window.dispatchEvent(new CustomEvent('sos-status-update', { detail: data }))
    })
    socket.on('rescue-completed', (data) => {
      window.dispatchEvent(new CustomEvent('rescue-completed', { detail: data }))
    })

    return () => { socket.disconnect() }
  }, [isAuthenticated, user])
}
