type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

const notifications = ref<Notification[]>([])

export function useNotification() {
  function add(type: NotificationType, message: string, duration = 4000) {
    const id = Math.random().toString(36).slice(2)
    notifications.value.push({ id, type, message, duration })
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
    return id
  }

  function remove(id: string) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  const success = (msg: string) => add('success', msg)
  const error = (msg: string) => add('error', msg, 6000)
  const warning = (msg: string) => add('warning', msg)
  const info = (msg: string) => add('info', msg)

  return { notifications, add, remove, success, error, warning, info }
}
