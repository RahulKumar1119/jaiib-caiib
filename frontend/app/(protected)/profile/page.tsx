'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account settings</p>
      </div>

      {user && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-md">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{user.status}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 w-full bg-danger-600 hover:bg-danger-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
