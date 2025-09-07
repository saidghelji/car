
import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, changePassword, updateUsername } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
    }
  }, [user]);

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(oldPassword, newPassword);
      toast.success('Mot de passe mis à jour avec succès.');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error(error.message || 'Erreur lors de la mise à jour du mot de passe.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUsername = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsUsernameLoading(true);
      await updateUsername(newUsername);
      toast.success('Nom d\'utilisateur mis à jour avec succès.');
    } catch (error: any) {
      console.error("Username update error:", error);
      toast.error(error.message || 'Erreur lors de la mise à jour du nom d\'utilisateur.');
    } finally {
      setIsUsernameLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Paramètres</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleUpdateUsername} className="space-y-6 mb-8">
          <section>
            <h2 className="text-lg font-medium mb-4">Changer le nom d'utilisateur</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </section>
          <div className="pt-4">
            <button
              type="submit"
              disabled={isUsernameLoading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isUsernameLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isUsernameLoading ? 'Mise à jour...' : 'Changer le nom d\'utilisateur'}
            </button>
          </div>
        </form>

        <form onSubmit={handleChangePassword} className="space-y-6">
          <section>
            <h2 className="text-lg font-medium mb-4">Changer le mot de passe</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ancien mot de passe
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </section>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Mise à jour...' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
