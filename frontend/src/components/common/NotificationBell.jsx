import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, Trash2, Calendar, AlertCircle, CheckCircle, Megaphone, Info } from 'lucide-react'
import { notificationService } from '../../services/api'
import Badge from './Badge'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)

  const fetchUnread = async () => {
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch {
      // Non-blocking
    }
  }

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const list = await notificationService.getMyNotifications({ limit: 30 })
      setNotifications(list)
      const count = list.filter((n) => !n.is_read).length
      setUnreadCount(count)
    } catch (e) {
      void e
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 20000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation()
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      void err
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      void err
    }
  }

  const handleDelete = async (id, e) => {
    e?.stopPropagation()
    try {
      await notificationService.deleteNotification(id)
      const deleted = notifications.find((n) => n.id === id)
      if (deleted && !deleted.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1))
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      void err
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'registration':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case 'cancellation':
        return <AlertCircle className="w-4 h-4 text-rose-500" />
      case 'event_update':
        return <Calendar className="w-4 h-4 text-sky-600" />
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-indigo-600" />
      case 'reminder':
        return <Calendar className="w-4 h-4 text-amber-600" />
      default:
        return <Info className="w-4 h-4 text-purple-600" />
    }
  }

  const formatTime = (isoString) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      const now = new Date()
      const diffMs = now - d
      const diffMin = Math.floor(diffMs / 60000)
      if (diffMin < 1) return 'Just now'
      if (diffMin < 60) return `${diffMin}m ago`
      const diffHrs = Math.floor(diffMin / 60)
      if (diffHrs < 24) return `${diffHrs}h ago`
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div className="relative inline-block" ref={panelRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-[#4a3f65] hover:bg-[#d9d2f0]/70 hover:text-[#1e1730] transition-colors cursor-pointer"
        aria-label="Notifications"
        title="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#e8e2f2]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-[#fdfcff] border border-[#cfc7df] shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#ede8f8] border-b border-[#cfc7df]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#1e1730]">Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="purple" size="sm">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-[#5a4d88] hover:text-[#3e3568] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[#ede8f8]">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#7a7088]">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-[#ede8f8] flex items-center justify-center text-[#8c7fb4] mb-2">
                  <Bell className="w-5 h-5 opacity-50" />
                </div>
                <p className="text-xs font-semibold text-[#1e1730]">All caught up!</p>
                <p className="text-[11px] text-[#7a7088] mt-0.5">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                  className={`p-3.5 flex gap-3 transition-colors ${
                    notif.is_read
                      ? 'bg-transparent hover:bg-[#ede8f8]/40'
                      : 'bg-[#ede8f8]/50 hover:bg-[#ede8f8]/80'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-white border border-[#cfc7df]/60 flex items-center justify-center shadow-xs">
                      {getTypeIcon(notif.notification_type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-xs ${notif.is_read ? 'font-medium text-[#1e1730]' : 'font-bold text-[#1e1730]'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-[#7a7088] shrink-0">
                        {formatTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#5a5168] mt-0.5 leading-snug line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between text-[10px]">
                      {notif.event_id ? (
                        <Link
                          to={`/student/events/${notif.event_id}`}
                          onClick={() => setIsOpen(false)}
                          className="text-[#5a4d88] font-semibold hover:underline"
                        >
                          View event &rarr;
                        </Link>
                      ) : (
                        <span />
                      )}

                      <div className="flex items-center gap-1 text-[#7a7088]">
                        {!notif.is_read && (
                          <span
                            title="Unread"
                            className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1"
                          />
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(notif.id, e)}
                          title="Delete notification"
                          className="hover:text-rose-500 p-0.5 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
