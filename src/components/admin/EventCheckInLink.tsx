// src/components/admin/EventCheckInLink.tsx
'use client'

import { useState } from 'react'
import { Copy, ExternalLink, QrCode } from 'lucide-react';
import { toast } from 'sonner'

interface EventCheckInLinkProps {
  eventId: number | null
  eventName?: string
  eventSlug?: string
}

export function EventCheckInLink({ eventId, eventName, eventSlug }: EventCheckInLinkProps) {
  const [copied, setCopied] = useState(false)

  // Generate URL based on eventId
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const checkInUrl = (eventId && eventSlug)
    ? `${baseUrl}/checkin/${eventSlug}`
    : `${baseUrl}/checkin`
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(checkInUrl)
      setCopied(true)
      toast.success('Link đã được copy!')
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {
      toast.error('Không thể copy link')
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-blue-900">
          Link Check-in {eventName ? `cho ${eventName}` : ''}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="p-2 cursor-pointer text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            title="Copy link"
          >
            <Copy className={`w-4 h-4 ${copied ? 'text-green-600' : ''}`} />
          </button>

          <a
            href={checkInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            title="Mở trong tab mới"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => {
              // Navigate to QR code page with eventSlug
              window.open(`/admin/qr-code/${eventSlug || 'default'}`, '_blank')
            }}
            className="p-2 cursor-pointer text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            title="Xem QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded border border-blue-100 px-3 py-2">
        <code className="text-xs text-gray-700 break-all">
          {checkInUrl}
        </code>
      </div>

      {eventId && (
        <p className="text-xs text-blue-700 mt-2">
          * Dùng link này cho QR code hoặc gửi cho người tham gia
        </p>
      )}
    </div>
  )
}