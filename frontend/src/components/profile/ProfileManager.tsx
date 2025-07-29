"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Camera,
  Edit3,
  Save,
  X,
  Phone,
  Mail,
  Calendar,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { useWallet } from "@/lib/WalletContext";
import { useToast } from "@/components/ui/toast";

interface ProfileManagerProps {
  onBack?: () => void;
  onSave?: (profile: UserProfile) => void;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  avatar?: string;
}

export default function ProfileManager({
  onBack,
  onSave,
}: ProfileManagerProps) {
  const { wallet } = useWallet();
  const { success } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showPersonalInfo, setShowPersonalInfo] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get profile data from localStorage or set defaults
  const getStoredProfile = (): UserProfile => {
    if (typeof window === "undefined") return getDefaultProfile();

    const stored = localStorage.getItem("padiPayUserProfile");
    if (stored) {
      return JSON.parse(stored);
    }
    return getDefaultProfile();
  };

  const getDefaultProfile = (): UserProfile => ({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    avatar: "",
  });

  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);
  const [editedProfile, setEditedProfile] = useState(profile);

  // Load profile on component mount
  useEffect(() => {
    const storedProfile = getStoredProfile();
    setProfile(storedProfile);
    setEditedProfile(storedProfile);
  }, []);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateProfile = () => {
    const newErrors: Record<string, string> = {};

    if (!editedProfile.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!editedProfile.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (
      editedProfile.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)
    ) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateProfile()) {
      setProfile(editedProfile);

      // Save to localStorage
      localStorage.setItem("padiPayUserProfile", JSON.stringify(editedProfile));

      setIsEditing(false);
      success("Profile updated successfully!");
      onSave?.(editedProfile);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setAvatarPreview(null);
    setErrors({});
    setIsEditing(false);
  };

  const getInitials = () => {
    const firstName = profile.firstName || "P";
    const lastName = profile.lastName || "U";
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getDisplayName = () => {
    if (profile.firstName || profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`.trim();
    }
    return "PadiPay User";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold">
            {isEditing ? "Edit Profile" : "My Profile"}
          </h1>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 size={16} />
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X size={16} />
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {avatarPreview || profile.avatar ? (
                  <img
                    src={avatarPreview || profile.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {getInitials()}
                  </span>
                )}
              </div>

              {isEditing && (
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-blue-700 transition-colors">
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Basic Info */}
            <div className="text-center space-y-2">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold">{getDisplayName()}</h2>
                {wallet && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    <Shield size={12} className="mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                {profile.email && <span>{profile.email}</span>}
                {profile.email && wallet && <span>•</span>}
                {wallet && <span>{wallet.getPhoneNumber()}</span>}
              </div>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPersonalInfo(!showPersonalInfo)}
            >
              {showPersonalInfo ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>

          {showPersonalInfo && (
            <div className="space-y-4">
              {/* First Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  First Name
                </label>
                {isEditing ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={editedProfile.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.firstName ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && (
                      <div className="flex items-center space-x-1 text-red-600 text-xs">
                        <AlertCircle size={12} />
                        <span>{errors.firstName}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {profile.firstName || "Not provided"}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Last Name
                </label>
                {isEditing ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={editedProfile.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.lastName ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <div className="flex items-center space-x-1 text-red-600 text-xs">
                        <AlertCircle size={12} />
                        <span>{errors.lastName}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {profile.lastName || "Not provided"}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                {isEditing ? (
                  <div className="space-y-1">
                    <input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <div className="flex items-center space-x-1 text-red-600 text-xs">
                        <AlertCircle size={12} />
                        <span>{errors.email}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Mail size={16} className="text-gray-400" />
                    <p className="text-gray-900">
                      {profile.email || "Not provided"}
                    </p>
                  </div>
                )}
              </div>

              {/* Phone (Read-only) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="flex items-center space-x-2">
                  <Phone size={16} className="text-gray-400" />
                  <p className="text-gray-900">
                    {wallet?.getPhoneNumber() || "Not available"}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Verified
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  Phone number is linked to your wallet and cannot be changed
                </p>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedProfile.dateOfBirth}
                    onChange={(e) =>
                      handleInputChange("dateOfBirth", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-400" />
                    <p className="text-gray-900">
                      {profile.dateOfBirth
                        ? new Date(profile.dateOfBirth).toLocaleDateString()
                        : "Not provided"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Address Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Address Information</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Street Address
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter street address"
                />
              ) : (
                <p className="text-gray-900">
                  {profile.address || "Not provided"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.city || ""}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter city"
                  />
                ) : (
                  <p className="text-gray-900">
                    {profile.city || "Not provided"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  State
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.state || ""}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter state"
                  />
                ) : (
                  <p className="text-gray-900">
                    {profile.state || "Not provided"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Wallet Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Wallet Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Wallet Address</span>
              <span className="text-sm font-mono">
                {wallet
                  ? `${wallet.getWalletAddress().slice(0, 8)}...${wallet
                      .getWalletAddress()
                      .slice(-6)}`
                  : "Not available"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Status</span>
              <Badge className="bg-green-100 text-green-700">
                <Shield size={12} className="mr-1" />
                Active
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
