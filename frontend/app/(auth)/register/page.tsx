'use client'

import RegistrationForm from '@/components/RegistrationForm'

export default function RegisterPage() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-primary-700 dark:text-primary-300">
        Create Account
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
        Register for your exam preparation account
      </p>

      <RegistrationForm />
    </div>
  )
}
