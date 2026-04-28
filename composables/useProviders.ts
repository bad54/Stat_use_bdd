import type { Provider } from '~/types'

export function useProviders() {
  const providers = useState<Provider[]>('providers', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProviders(activeOnly = false) {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<Provider[]>('/api/providers', {
        params: activeOnly ? { active: 'true' } : {},
      })
      providers.value = data
    } catch (e: any) {
      error.value = e.data?.message ?? 'Erreur lors du chargement des fournisseurs.'
    } finally {
      loading.value = false
    }
  }

  async function createProvider(form: Partial<Provider>) {
    const data = await $fetch<Provider>('/api/providers', {
      method: 'POST',
      body: form,
    })
    providers.value.push(data)
    return data
  }

  async function updateProvider(id: string, form: Partial<Provider>) {
    const data = await $fetch<Provider>(`/api/providers/${id}`, {
      method: 'PUT',
      body: form,
    })
    const idx = providers.value.findIndex(p => p.id === id)
    if (idx !== -1) providers.value[idx] = data
    return data
  }

  async function deleteProvider(id: string) {
    await $fetch(`/api/providers/${id}`, { method: 'DELETE' })
    providers.value = providers.value.filter(p => p.id !== id)
  }

  async function toggleActive(id: string, isActive: boolean) {
    return updateProvider(id, { isActive })
  }

  return {
    providers,
    loading,
    error,
    fetchProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    toggleActive,
  }
}
