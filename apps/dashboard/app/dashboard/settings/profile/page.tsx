"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: string;
  timezone: string;
}

export default function ProfilePage() {
  const { user, setUser } = useUser();
  const [form, setForm] = useState<ProfileFormData>({ ...user });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Sync form when global user changes (e.g. on first load / hydration)
  useEffect(() => {
    setForm({ ...user });
  }, [user]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(user);

  const handleChange = useCallback(
    (field: keyof ProfileFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    },
    [],
  );

  const handleSave = async () => {
    setSaving(true);
    // Simulate API save
    await new Promise((r) => setTimeout(r, 900));
    setUser({ ...user, ...form });
    setSaving(false);
    setEditing(false);
    setToast("Profile updated successfully");
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancel = () => {
    setForm({ ...user });
    setEditing(false);
  };

  const initials = `${form.firstName[0] ?? ""}${form.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="profile">
      {/* Toast */}
      {toast && (
        <div className="profile__toast" role="status">
          <span className="profile__toast-icon">✓</span>
          {toast}
        </div>
      )}

      {/* Avatar + name header */}
      <div className="profile__hero">
        <div className="profile__avatar-lg" aria-hidden="true">
          <span>{initials}</span>
        </div>
        <div className="profile__hero-info">
          <h3 className="profile__hero-name">
            {form.firstName} {form.lastName}
          </h3>
          <span className="profile__hero-role">{form.role}</span>
          <span className="profile__hero-email">{form.email}</span>
        </div>
        {!editing && (
          <button
            className="profile__edit-btn"
            type="button"
            onClick={() => setEditing(true)}
            id="profile-edit-btn"
          >
            ✎ Edit Profile
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="profile__card">
        <h4 className="profile__card-title">Personal Information</h4>
        <p className="profile__card-subtitle">
          Update your personal details. These are visible to workspace members.
        </p>

        <div className="profile__fields">
          <div className="profile__row">
            <ProfileField
              label="First Name"
              value={form.firstName}
              editing={editing}
              onChange={handleChange("firstName")}
              id="profile-first-name"
            />
            <ProfileField
              label="Last Name"
              value={form.lastName}
              editing={editing}
              onChange={handleChange("lastName")}
              id="profile-last-name"
            />
          </div>

          <div className="profile__row">
            <ProfileField
              label="Email Address"
              value={form.email}
              editing={editing}
              onChange={handleChange("email")}
              type="email"
              icon="✉"
              id="profile-email"
            />
            <ProfileField
              label="Mobile Number"
              value={form.mobile}
              editing={editing}
              onChange={handleChange("mobile")}
              type="tel"
              icon="📱"
              id="profile-mobile"
            />
          </div>

          <div className="profile__row">
            <ProfileField
              label="Role"
              value={form.role}
              editing={false}
              onChange={() => {}}
              id="profile-role"
              disabled
            />
            <ProfileField
              label="Timezone"
              value={form.timezone}
              editing={editing}
              onChange={handleChange("timezone")}
              id="profile-timezone"
            />
          </div>
        </div>

        {/* Action buttons */}
        {editing && (
          <div className="profile__actions">
            <button
              className="profile__btn profile__btn--secondary"
              type="button"
              onClick={handleCancel}
              id="profile-cancel-btn"
            >
              Cancel
            </button>
            <button
              className="profile__btn profile__btn--primary"
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              id="profile-save-btn"
            >
              {saving ? <span className="profile__spinner" /> : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Security card */}
      <div className="profile__card">
        <h4 className="profile__card-title">Security</h4>
        <p className="profile__card-subtitle">
          Manage your password and two-factor authentication settings.
        </p>

        <div className="profile__security-row">
          <div className="profile__security-item">
            <span className="profile__security-icon">🔒</span>
            <div>
              <p className="profile__security-label">Password</p>
              <p className="profile__security-value">Last changed 14 days ago</p>
            </div>
            <button className="profile__btn profile__btn--outline" type="button" id="change-password-btn">
              Change
            </button>
          </div>

          <div className="profile__security-item">
            <span className="profile__security-icon">🛡️</span>
            <div>
              <p className="profile__security-label">Two-Factor Authentication</p>
              <p className="profile__security-value">Not enabled</p>
            </div>
            <button className="profile__btn profile__btn--outline" type="button" id="enable-2fa-btn">
              Enable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable field component ───────────────────────────────── */
function ProfileField({
  label,
  value,
  editing,
  onChange,
  type = "text",
  icon,
  id,
  disabled = false,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  icon?: string;
  id: string;
  disabled?: boolean;
}) {
  return (
    <div className="profile__field">
      <label className="profile__label" htmlFor={id}>
        {label}
      </label>
      {editing && !disabled ? (
        <div className="profile__input-wrapper">
          {icon && <span className="profile__input-icon">{icon}</span>}
          <input
            className={`profile__input ${icon ? "profile__input--has-icon" : ""}`}
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            autoComplete="off"
          />
        </div>
      ) : (
        <p className={`profile__value ${disabled ? "profile__value--muted" : ""}`}>{value}</p>
      )}
    </div>
  );
}
