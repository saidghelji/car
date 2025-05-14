import React from 'react';

const Settings = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Paramètres</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-medium mb-4">Paramètres généraux</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrez le nom de votre entreprise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email de contact
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@entreprise.com"
                />
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-lg font-medium mb-4">Préférences de notification</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotif"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotif" className="ml-2 text-sm text-gray-700">
                  Notifications par email
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="smsNotif"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="smsNotif" className="ml-2 text-sm text-gray-700">
                  Notifications par SMS
                </label>
              </div>
            </div>
          </section>

          <div className="pt-4">
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sauvegarder les modifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;