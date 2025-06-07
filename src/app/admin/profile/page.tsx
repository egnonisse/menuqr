"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { UserIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  
  // Get user data
  const { data: user } = api.auth.getProfile.useQuery();
  
  // Mutations
  const updateProfileMutation = api.auth.updateProfile.useMutation({
    onSuccess: () => {
      alert("Profil mis à jour avec succès !");
    },
    onError: (error) => {
      alert("Erreur : " + error.message);
    },
  });

  const changePasswordMutation = api.auth.changePassword.useMutation({
    onSuccess: () => {
      alert("Mot de passe modifié avec succès !");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error) => {
      alert("Erreur : " + error.message);
    },
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Les mots de passe ne correspondent pas !");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères !");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const tabs = [
    { id: "profile", label: "Mon profil", icon: UserIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profil & Paramètres</h1>
        <p className="mt-2 text-gray-600">
          Gérez les informations de votre restaurant et votre profil personnel
        </p>
      </div>

      {/* Profile Section */}
        <div className="space-y-6">
          {/* Profile Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <UserIcon className="h-6 w-6 mr-2 text-indigo-600" />
                Informations personnelles
              </h2>
              <p className="text-gray-600">
                Modifiez vos informations de gérant
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de connexion *
                  </label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? "Sauvegarde..." : "Sauvegarder le profil"}
                </button>
              </div>
            </form>
          </div>

          {/* Password Change */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Modifier le mot de passe
              </h3>
              <p className="text-gray-600">
                Changez votre mot de passe de connexion
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe actuel *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.current ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.new ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le nouveau mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.confirm ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important :</strong> Le mot de passe doit contenir au moins 6 caractères.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {changePasswordMutation.isPending ? "Modification..." : "Modifier le mot de passe"}
                </button>
              </div>
            </form>
          </div>
        </div>
    </div>
  );
} 